'use strict';

var castToObjectId = require('mongodb').ObjectId;
var usersTransforms = require('./users.transforms');
var controllersUtils = require('../utils/controllers');

module.exports = initUsersController;

function initUsersController(context) {
  var userController = {
    list: userControllerList,
    get: userControllerGet,
    put: userControllerPut,
    delete: userControllerDelete,
    listFriends: userControllerListFriends,
  };

  return userController;

  function userControllerList(req, res, next) {
    context.db.collection('users').find({}).toArray()
    .then(function(entries) {
      res.status(200).send(entries.map(usersTransforms.fromCollection));
    }).catch(next);
  }

  function userControllerGet(req, res, next) {
    context.db.collection('users').findOne({
      _id: castToObjectId(req.params.user_id),
    })
    .then(function(entry) {
      if(!entry) {
        return res.sendStatus(404);
      }
      res.status(200).send(usersTransforms.fromCollection(entry));
    }).catch(next);
  }

  function userControllerPut(req, res, next) {
    var dateSeal = controllersUtils.getDateSeal(context.time(), req);

    context.db.collection('users').findOneAndUpdate({
      _id: castToObjectId(req.params.user_id),
    }, {
      $set: {
        contents: req.body.contents || {},
      },
      $setOnInsert: {
        user_id: req.user._id,
        password: req.body.password,
        // Setting the PSA test car
        'auth.psa': {
          vin: 'VF7NC9HD8DY611112',
          contract: '620028501',
          code: 'KNL347037',
        },
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
    })
    .then(function(result) {
      res.status(201).send(usersTransforms.fromCollection(result.value));
    }).catch(next);
  }

  function userControllerDelete(req, res, next) {
    Promise.all([
      context.db.collection('users').deleteOne({
        _id: castToObjectId(req.params.user_id),
      }),
      context.db.collection('users').updateMany({
        friends_ids: castToObjectId(req.params.user_id),
      }, {
        $pull: {
          friends_ids: castToObjectId(req.params.user_id),
        },
      }),
      context.db.collection('events').deleteMany({
        owner_id: castToObjectId(req.params.user_id),
      }),
      context.db.collection('events').updateMany({
        owner_id: { $nin: [castToObjectId(req.params.user_id)] },
        'trip.friends_ids': castToObjectId(req.params.user_id),
      }, {
        $pull: {
          'trip.friends_ids': castToObjectId(req.params.user_id),
        },
      }),
    ])

    .then(function() {
      res.status(410).send();
    }).catch(next);
  }

  function userControllerListFriends(req, res, next) {
    context.db.collection('users').findOne({
      _id: castToObjectId(req.params.user_id),
    })
    .then(function(entry) {
      if(!entry) {
        return res.sendStatus(404);
      }
      return context.db.collection('users').find({
        _id: {
          $in: entry.friends_ids || [],
        },
      }).toArray()
      .then(function(entries) {
        res.status(200).send(entries.map(usersTransforms.fromCollection));
      });
    }).catch(next);
  }
}
