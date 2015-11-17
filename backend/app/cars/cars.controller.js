'use strict';

var carsTransforms = require('./cars.transforms');
var Promise = require('bluebird');

module.exports = initCarsController;

function initCarsController(context) {
  var carController = {
    list: carControllerList,
    get: carControllerGet,/*
    put: carControllerPut,
    delete: carControllerDelete,*/
  };

  return carController;

  function carControllerList(req, res, next) {
    context.db.collection('users').aggregate([{
      $match: {
        _id: context.castToObjectId(req.params.user_id),
      },
    }, {
      $unwind: '$cars',
    }, {
      $project: {
        _id: '$cars._id',
        user_id: '$_id',
        contents: '$cars',
      },
    }]).toArray()
    .then(function(entries) {
      res.status(200).send(entries.map(carsTransforms.fromCollection));
    }).catch(next);
  }

  function carControllerGet(req, res, next) {
    context.db.collection('users').aggregate([{
      $match: {
        _id: context.castToObjectId(req.params.user_id),
      },
    }, {
      $unwind: '$cars',
    }, {
      $project: {
        _id: '$cars._id',
        user_id: '$_id',
        contents: '$cars',
      },
    }, {
      $match: {
        _id: context.castToObjectId(req.params.car_id),
      },
    }]).toArray()
    .then(function(entries) {
      if(!entries.length) {
        return res.sendStatus(404);
      }
      res.status(200).send(carsTransforms.fromCollection(entries[0]));
    }).catch(next);
  }
/*
  function carControllerPut(req, res, next) {
    Promise.all([
      context.db.collection('events').findOneAndUpdate({
        owner_id: context.castToObjectId(req.params.user_id),
        'contents.car_id': context.castToObjectId(req.params.car_id),
        'contents.type': 'car-start',
      }, {
        $set: {
          contents: {
            car_id: context.castToObjectId(req.params.car_id),
            type: 'car-start',
            date: (new Date()).toISOString(),
          },
          car: req.body.contents || {},
        },
        $setOnInsert: {
          _id: context.castToObjectId(req.params.car_id),
          owner_id: context.castToObjectId(req.params.user_id),
        },
      }, {
        upsert: true,
        returnOriginal: false,
      }),
      context.db.collection('events').updateMany({
        owner_id: context.castToObjectId(req.params.user_id),
        'contents.car_id': context.castToObjectId(req.params.car_id),
        'contents.type': { $ne: 'car-start' },
      }, {
        $set: {
          car: req.body.contents || {},
        },
      }),
    ])
    .spread(function(result) {
      res.status(201).send(carsTransforms.fromCollection(result.value));
    }).catch(next);
  }

  function carControllerDelete(req, res, next) {
    context.db.collection('events').findOne({
      owner_id: context.castToObjectId(req.params.user_id),
      'contents.car_id': context.castToObjectId(req.params.car_id),
      'contents.type': 'car-start',
    }).then(function(startEvent) {
      if(!startEvent) {
        res.sendStatus(410);
        return Promise.resolve();
      }
      return context.db.collection('events').deleteMany({
        _id: context.castToObjectId(req.params.car_id),
      })
      .then(function() {
        res.sendStatus(410);
      });
    }).catch(next);
  }
  */
}
