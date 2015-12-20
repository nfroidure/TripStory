'use strict';

var castToObjectId = require('mongodb').ObjectId;
var tripsTransforms = require('./trips.transforms');
var eventsTransforms = require('../events/events.transforms');
var controllersUtils = require('../utils/controllers');
var Promise = require('bluebird');

module.exports = initTripsController;

function initTripsController(context) {
  var tripController = {
    list: tripControllerList,
    get: tripControllerGet,
    put: tripControllerPut,
    delete: tripControllerDelete,
  };

  return tripController;

  function tripControllerList(req, res, next) {
    context.db.collection('events').aggregate([{
      $match: {
        $or: [{
          owner_id: castToObjectId(req.params.user_id),
        }, {
          'trip.friends_ids': castToObjectId(req.params.user_id),
        }],
        'contents.type': {
          $in: ['trip-start', 'trip-stop'],
        },
      },
    }, {
      $sort: {
        'created.seal_date': 1,
      },
    }, {
      $project: {
        _id: '$contents.trip_id',
        contents: '$trip',
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
        created: { $first: '$created' },
        modified: { $last: '$created' },
        ended: { $last: '$ended' },
      },
    }]).toArray()
    .then(function(entries) {
      res.status(200).send(entries.map(tripsTransforms.fromCollection));
    }).catch(next);
  }

  function tripControllerGet(req, res, next) {
    context.db.collection('events').aggregate([{
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
        events: { $push: '$event' },
        created: { $first: '$created' },
        modified: { $last: '$created' },
        ended: { $last: '$ended' },
      },
    }]).toArray()
    .then(function(entries) {
      var payload;

      if(!entries.length) {
        return res.sendStatus(404);
      }
      payload = tripsTransforms.fromCollection(entries[0]);
      payload.events = entries[0].events.map(eventsTransforms.fromCollection);
      res.status(200).send(payload);
    }).catch(next);
  }

  function tripControllerPut(req, res, next) {
    var dateSeal = controllersUtils.getDateSeal(context.time(), req);
    var newTrip = tripsTransforms.toCollection(req.body || {});

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
    .spread(function(result) {
      res.status(201).send(tripsTransforms.fromCollection(result.value));
    }).catch(next);
  }

  function tripControllerDelete(req, res, next) {
    context.db.collection('events').findOne({
      owner_id: castToObjectId(req.params.user_id),
      'contents.trip_id': castToObjectId(req.params.trip_id),
      'contents.type': 'trip-start',
    }).then(function(startEvent) {
      if(!startEvent) {
        res.sendStatus(410);
        return Promise.resolve();
      }
      return context.db.collection('events').deleteMany({
        _id: castToObjectId(req.params.trip_id),
      })
      .then(function() {
        res.sendStatus(410);
      });
    }).catch(next);
  }
}
