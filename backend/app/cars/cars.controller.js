'use strict';

const castToObjectId = require('mongodb').ObjectId;
const YHTTPError = require('yhttperror');
const carsTransforms = require('./cars.transforms');

module.exports = initCarsController;

function initCarsController(context) {
  const carController = {
    list: carControllerList,
    get: carControllerGet,
    delete: carControllerDelete,
  };

  return carController;

  function carControllerList(req, res, next) {
    Promise.resolve([])
    .then((pipeline) => {
      if(req.params.user_id) {
        pipeline.push({
          $match: {
            _id: castToObjectId(req.params.user_id),
          },
        });
      }
      return pipeline;
    })
    .catch((err) => {
      throw YHTTPError.wrap(err, 400, 'E_BAD_USER_ID', req.params.user_id);
    })
    .then(pipeline => pipeline.concat({
      $unwind: '$cars',
    }, {
      $project: {
        _id: '$cars._id',
        user_id: '$_id',
        contents: '$cars',
      },
    }))
    .then(pipeline => context.db.collection('users').aggregate(pipeline).toArray())
    .then(entries => {
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
    .then(entries => {
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
    }).then(result => {
      res.sendStatus(410);
    }).catch(next);
  }

}
