'use strict';

function initEventsController(context) {
  var eventController = {
    list: eventControllerList,
    get: eventControllerGet,
    put: eventControllerPut,
    delete: eventControllerDelete,
  };

  return eventController;

  function eventControllerList(req, res, next) {
    context.db.collection('events').find({}).toArray()
    .then(function(entries) {
      res.status(200).send(entries);
    }).catch(next);
  }

  function eventControllerGet(req, res, next) {
    context.db.collection('events').findOne({
      _id: context.castToObjectId(req.params.event_id),
    })
    .then(function(entry) {
      if(!entry) {
        return res.sendStatus(404);
      }
      res.status(200).send(entry);
    }).catch(next);
  }

  function eventControllerPut(req, res, next) {
    context.db.collection('events').findOneAndUpdate({
      _id: context.castToObjectId(req.params.event_id),
    }, {
      $set: {
        contents: req.body.contents || {},
      },
    }, {
      returnOriginal: false,
    })
    .then(function(result) {
      res.status(201).send(result.value);
    }).catch(next);
  }

  function eventControllerDelete(req, res, next) {
    context.db.collection('events').findOneAndDelete({
      _id: context.castToObjectId(req.params.event_id),
    })
    .then(function(entry) {
      res.status(204).send(entry);
    }).catch(next);
  }
}

module.exports = initEventsController;