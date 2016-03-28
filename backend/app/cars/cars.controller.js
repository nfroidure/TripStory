'use strict';

var castToObjectId = require('mongodb').ObjectId;
var YHTTPError = require('yhttperror');
var carsTransforms = require('./cars.transforms');

module.exports = initCarsController;

function initCarsController(context) {
  var carController = {
    list: carControllerList,
    get: carControllerGet,
    delete: carControllerDelete,
  };

  return carController;

  function carControllerList(req, res, next) {
    Promise.resolve([])
    .then(function(pipeline) {
      if(req.params.user_id) {
        pipeline.push({
          $match: {
            _id: castToObjectId(req.params.user_id),
          },
        });
      }
      return pipeline;
    })
    .catch(function castUserError(err) {
      throw YHTTPError.wrap(err, 400, 'E_BAD_USER_ID', req.params.user_id);
    })
    .then(function(pipeline) {
      return pipeline.concat({
        $unwind: '$cars',
      }, {
        $project: {
          _id: '$cars._id',
          user_id: '$_id',
          contents: '$cars',
        },
      });
    })
    .then(function(pipeline) {
      return context.db.collection('users').aggregate(pipeline).toArray();
    })
    .then(function(entries) {
      res.status(200).send(entries.map(carsTransforms.fromCollection));
    }).catch(next);
  }

  function carControllerGet(req, res, next) {
    context.db.collection('users').aggregate([{
      $match: {
        _id: castToObjectId(req.params.user_id),
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
        _id: castToObjectId(req.params.car_id),
      },
    }]).toArray()
    .then(function(entries) {
      if(!entries.length) {
        return res.sendStatus(404);
      }
      res.status(200).send(carsTransforms.fromCollection(entries[0]));
    }).catch(next);
  }

  function carControllerDelete(req, res, next) {
    context.db.collection('users').updateOne({
      _id: castToObjectId(req.params.user_id),
    }, {
      $pull: {
        cars: {
          _id: castToObjectId(req.params.car_id),
        },
      },
    }).then(function(result) {
      res.sendStatus(410);
    }).catch(next);
  }

}
