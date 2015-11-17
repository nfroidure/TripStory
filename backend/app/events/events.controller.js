'use strict';

var eventsTransforms = require('./events.transforms');

module.exports = initEventsController;

function initEventsController(context) {
  var eventController = {
    list: eventControllerList,
    get: eventControllerGet,
    put: eventControllerPut,
    delete: eventControllerDelete,
  };

  return eventController;

  function eventControllerList(req, res, next) {
    context.db.collection('events').find({
      $or: [{
        owner_id: context.castToObjectId(req.params.user_id),
      }, {
        'trip.friends_ids': context.castToObjectId(req.params.user_id),
      }],
    }).toArray()
    .then(function(entries) {
      context.logger.debug('Sending:', entries);
      res.status(200).send(entries.map(eventsTransforms.fromCollection));
    }).catch(next);
  }

  function eventControllerGet(req, res, next) {
    context.db.collection('events').findOne({
      $or: [{
        owner_id: context.castToObjectId(req.params.user_id),
      }, {
        'trip.friends_ids': context.castToObjectId(req.params.user_id),
      }],
      _id: context.castToObjectId(req.params.event_id),
    })
    .then(function(entry) {
      if(!entry) {
        return res.sendStatus(404);
      }
      res.status(200).send(eventsTransforms.fromCollection(entry));
    }).catch(next);
  }

  function eventControllerPut(req, res, next) {
    context.db.collection('events').findOneAndUpdate({
      _id: context.castToObjectId(req.params.event_id),
      owner_id: context.castToObjectId(req.params.user_id),
    }, {
      $set: {
        contents: req.body.contents || {},
      },
      $setOnInsert: {
        _id: context.castToObjectId(req.params.event_id),
        owner_id: context.castToObjectId(req.params.user_id),
      },
    }, {
      upsert: true,
      returnOriginal: false,
    })
    .then(function(result) {
      res.status(201).send(eventsTransforms.fromCollection(result.value));
    }).catch(next);
  }

  function eventControllerDelete(req, res, next) {
    context.db.collection('events').deleteOne({
      _id: context.castToObjectId(req.params.event_id),
      owner_id: context.castToObjectId(req.params.user_id),
    })
    .then(function() {
      res.status(410).send();
    }).catch(next);
  }
}
