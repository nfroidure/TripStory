'use strict';

var tripsTransforms = require('./trips.transforms');
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
        'contents.trip_id': context.castToObjectId(req.params.trip_id),
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
      if(!entries.length) {
        return res.sendStatus(404);
      }
      res.status(200).send(entries[0]);
    }).catch(next);
  }

  function tripControllerPut(req, res, next) {
    Promise.all([
      context.db.collection('events').findOneAndUpdate({
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
      }, {
        upsert: true,
        returnOriginal: false,
      }),
      context.db.collection('events').updateMany({
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
    context.db.collection('events').deleteMany({
      _id: context.castToObjectId(req.params.trip_id),
    })
    .then(function() {
      res.sendStatus(410);
    }).catch(next);
  }
}
