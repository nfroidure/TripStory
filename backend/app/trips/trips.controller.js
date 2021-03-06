'use strict';

const castToObjectId = require('mongodb').ObjectId;
const usersTransforms = require('../users/users.transforms');
const tripsTransforms = require('./trips.transforms');
const eventsTransforms = require('../events/events.transforms');
const controllersUtils = require('../utils/controllers');
const Promise = require('bluebird');
const YHTTPError = require('yhttperror');

module.exports = initTripsController;

function initTripsController(context) {
  const tripController = {
    list: tripControllerList,
    get: tripControllerGet,
    put: tripControllerPut,
    delete: tripControllerDelete,
  };

  return tripController;

  function tripControllerList(req, res, next) {
    createTripListAggregateStages(context, req)
      .then(executeAggregate.bind(null, context, 'events'))
      .then(mapEntries.bind(
        null,
        context,
        tripsTransforms.fromCollection
      ))
      .then(sendPayload.bind(null, context, res, 200))
      .catch(next);
  }

  function tripControllerGet(req, res, next) {
    createTripGetAggregateStages(context, req)
      .then(executeAggregate.bind(null, context, 'events'))
      .then(castResultsToEvent.bind(null, context))
      .then(embedAssociatedUsers.bind(null, context))
      .then(sendPayload.bind(null, context, res, 200))
      .catch(next);
  }

  function tripControllerPut(req, res, next) {
    const dateSeal = controllersUtils.getDateSeal(context.time(), req);
    const newTrip = tripsTransforms.toCollection(req.body || {});

    Promise.all([
      context.db.collection('events').findOneAndUpdate({
        owner_id: castToObjectId(req.params.user_id),
        'contents.trip_id': castToObjectId(req.params.trip_id),
        'contents.type': 'trip-start',
      }, {
        $set: {
          contents: {
            trip_id: castToObjectId(req.params.trip_id),
            type: 'trip-start',
          },
          trip: newTrip.contents,
        },
        $setOnInsert: {
          _id: castToObjectId(req.params.trip_id),
          owner_id: castToObjectId(req.params.user_id),
          created: dateSeal,
        },
        $push: {
          modified: {
            $each: [dateSeal],
            $slice: -10,
          },
        },
      }, {
        upsert: true,
        returnOriginal: false,
      }),
      context.db.collection('events').updateMany({
        owner_id: castToObjectId(req.params.user_id),
        'contents.trip_id': castToObjectId(req.params.trip_id),
        'contents.type': { $ne: 'trip-start' },
      }, {
        $set: {
          trip: newTrip.contents,
        },
      }),
    ])
    .spread((result) => {
      let payload = {
        _id: result.value._id,
        contents: result.value.trip,
        created: result.value.created,
        owner_id: result.value.owner_id,
      };

      context.bus.trigger({
        exchange: result.lastErrorObject.updatedExisting ?
          'A_TRIP_UPDATED' :
          'A_TRIP_CREATED',
        contents: {
          trip_id: castToObjectId(req.params.trip_id),
          users_ids: result.value.trip.friends_ids
            .concat(castToObjectId(req.params.user_id)),
        },
      });
      res.status(201).send(tripsTransforms.fromCollection(payload));
    }).catch(next);
  }

  function tripControllerDelete(req, res, next) {
    context.db.collection('events').findOne({
      'contents.trip_id': castToObjectId(req.params.trip_id),
      $or: [{
        owner_id: castToObjectId(req.params.user_id),
      }, {
        'trip.friends_ids': castToObjectId(req.params.user_id),
      }],
      'contents.type': 'trip-start',
    }).then((startEvent) => {
      if(!startEvent) {
        res.sendStatus(410);
        return Promise.resolve();
      }
      // If the trip found is not owned, just leave it
      if(req.params.user_id !== startEvent.owner_id.toString()) {
        return context.db.collection('events').updateMany({
          'contents.trip_id': castToObjectId(req.params.trip_id),
        }, {
          $pull: {
            'trip.friends_ids': castToObjectId(req.params.user_id),
          },
        })
        .then(() => {
          res.sendStatus(410);
        })
        .then(() => {
          context.bus.trigger({
            exchange: 'A_TRIP_LEFT',
            contents: {
              trip_id: castToObjectId(req.params.trip_id),
              user_id: castToObjectId(req.params.user_id),
              users_ids: startEvent.trip.friends_ids.concat(startEvent.owner_id)
                .filter(userId => userId.toString() !== req.params.user_id),
            },
          });
        });
      }
      // Otherwise, delete it
      return context.db.collection('events').deleteMany({
        'contents.trip_id': castToObjectId(req.params.trip_id),
      })
      .then(() => {
        res.sendStatus(410);
      })
      .then(() => {
        context.bus.trigger({
          exchange: 'A_TRIP_DELETED',
          contents: {
            trip_id: castToObjectId(req.params.trip_id),
            users_ids: startEvent.trip.friends_ids.concat(startEvent.owner_id),
          },
        });
      });
    })
    .catch(next);
  }
}

function createTripListAggregateStages(context, req) {
  return Promise.resolve().then(() => {
    const matchStage = {
      $match: {
        'contents.type': {
          $in: ['trip-start', 'trip-stop'],
        },
      },
    };

    if(req.params.user_id) {
      matchStage.$match.$or = [{
        owner_id: castToObjectId(req.params.user_id),
      }, {
        'trip.friends_ids': castToObjectId(req.params.user_id),
      }];
    }

    return [matchStage, {
      $sort: {
        'created.seal_date': 1,
      },
    }, {
      $project: {
        _id: '$contents.trip_id',
        contents: '$trip',
        owner_id: '$owner_id',
        created: '$created',
        ended: { $cond: {
          if: { $eq: ['trip-stop', '$contents.type'] },
          then: '$created',
          else: null,
        } },
      },
    }, {
      $group: {
        _id: '$_id',
        contents: { $first: '$contents' },
        owner_id: { $first: '$owner_id' },
        created: { $first: '$created' },
        modified: { $last: '$created' },
        ended: { $last: '$ended' },
      },
    }];
  });
}

function mapEntries(context, mapper, entries) {
  return entries.map(mapper);
}

function executeAggregate(context, collection, stages) {
  return context.db.collection(collection).aggregate(stages).toArray();
}

function sendPayload(context, res, status, payload) {
  res.status(status).send(payload);
}

function createTripGetAggregateStages(context, req) {
  return Promise.resolve().then(() => [{
    $match: {
      $or: [{
        owner_id: castToObjectId(req.params.user_id),
      }, {
        'trip.friends_ids': castToObjectId(req.params.user_id),
      }],
      'contents.trip_id': castToObjectId(req.params.trip_id),
    },
  }, {
    $project: {
      _id: '$contents.trip_id',
      contents: '$trip',
      owner_id: '$owner_id',
      created: '$created',
      ended: { $cond: {
        if: { $eq: ['trip-stop', '$contents.type'] },
        then: '$created',
        else: null,
      } },
      event: {
        _id: '$_id',
        created: '$created',
        contents: '$contents',
      },
    },
  }, {
    $sort: {
      'event.created.seal_date': 1,
    },
  }, {
    $group: {
      _id: '$_id',
      contents: { $first: '$contents' },
      owner_id: { $first: '$owner_id' },
      events: { $push: '$event' },
      created: { $first: '$created' },
      modified: { $last: '$created' },
      ended: { $last: '$ended' },
    },
  }]);
}

function castResultsToEvent(context, entries) {
  let payload;

  if(!entries.length) {
    throw new YHTTPError(410, 'E_NOT_FOUND');
  }
  payload = tripsTransforms.fromCollection(entries[0]);
  payload.events = entries[0].events.map(eventsTransforms.fromCollection);
  return payload;
}

function embedAssociatedUsers(context, payload) {
  return context.db.collection('users').find({
    _id: { $in:
      payload.contents.friends_ids.concat(payload.owner_id).map(castToObjectId),
    },
  }).toArray()
  .then((users) => {
    payload.users = users.map(usersTransforms.fromCollection)
    .reduce((hash, user) => {
      hash[user._id] = user;
      return hash;
    }, {});
    return payload;
  });
}
