'use strict';

var tripsTransforms = require('./trips.transforms');
var eventsTransforms = require('../events/events.transforms');
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
          owner_id: context.castToObjectId(req.params.user_id),
        }, {
          'trip.friends_ids': context.castToObjectId(req.params.user_id),
        }],
      },
    }, {
      $project: {
        _id: '$contents.trip_id',
        contents: '$trip',
      },
    }, {
      $group: {
        _id: '$_id',
        contents: { $first: '$contents' },
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
          owner_id: context.castToObjectId(req.params.user_id),
        }, {
          'trip.friends_ids': context.castToObjectId(req.params.user_id),
        }],
        'contents.trip_id': context.castToObjectId(req.params.trip_id),
      },
    }, {
      $project: {
        _id: '$contents.trip_id',
        contents: '$trip',
        event: {
          _id: '$_id',
          contents: '$contents',
        },
      },
    }, {
      $group: {
        _id: '$_id',
        contents: { $first: '$contents' },
        events: { $push: '$event' },
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
    Promise.all([
      context.db.collection('events').findOneAndUpdate({
        owner_id: context.castToObjectId(req.params.user_id),
        'contents.trip_id': context.castToObjectId(req.params.trip_id),
        'contents.type': 'trip-start',
      }, {
        $set: {
          contents: {
            trip_id: context.castToObjectId(req.params.trip_id),
            type: 'trip-start',
            date: (new Date()).toISOString(),
          },
          trip: req.body.contents || {},
        },
        $setOnInsert: {
          _id: context.castToObjectId(req.params.trip_id),
          owner_id: context.castToObjectId(req.params.user_id),
        },
      }, {
        upsert: true,
        returnOriginal: false,
      }),
      context.db.collection('events').updateMany({
        owner_id: context.castToObjectId(req.params.user_id),
        'contents.trip_id': context.castToObjectId(req.params.trip_id),
        'contents.type': { $ne: 'trip-start' },
      }, {
        $set: {
          trip: req.body.contents || {},
        },
      }),
    ])
    .spread(function(result) {
      res.status(201).send(tripsTransforms.fromCollection(result.value));
    }).catch(next);
  }

  function tripControllerDelete(req, res, next) {
    context.db.collection('events').findOne({
      owner_id: context.castToObjectId(req.params.user_id),
      'contents.trip_id': context.castToObjectId(req.params.trip_id),
      'contents.type': 'trip-start',
    }).then(function(startEvent) {
      if(!startEvent) {
        res.sendStatus(410);
        return Promise.resolve();
      }
      return context.db.collection('events').deleteMany({
        _id: context.castToObjectId(req.params.trip_id),
      })
      .then(function() {
        res.sendStatus(410);
      });
    }).catch(next);
  }
}
