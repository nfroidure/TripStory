'use strict';

var usersTransforms = require('./users.transforms');

function initUsersController(context) {
  var userController = {
    list: userControllerList,
    get: userControllerGet,
    put: userControllerPut,
    delete: userControllerDelete,
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
      _id: context.castToObjectId(req.params.user_id),
    })
    .then(function(entry) {
      if(!entry) {
        return res.sendStatus(404);
      }
      res.status(200).send(entry);
    }).catch(next);
  }

  function userControllerPut(req, res, next) {
    context.db.collection('users').findOneAndUpdate({
      _id: context.castToObjectId(req.params.user_id),
    }, {
      $set: {
        contents: req.body.contents || {},
      },
      $setOnInsert: {
        password: req.body.password,
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
    context.db.collection('users').findOneAndDelete({
      _id: context.castToObjectId(req.params.user_id),
    })
    .then(function(result) {
      res.status(410).send(result.value ? usersTransforms.fromCollection(result.value) : {});
    }).catch(next);
  }
}

module.exports = initUsersController;
