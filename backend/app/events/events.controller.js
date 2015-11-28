'use strict';

var castToObjectId = require('mongodb').ObjectId;
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
        owner_id: castToObjectId(req.params.user_id),
      }, {
        'trip.friends_ids': castToObjectId(req.params.user_id),
      }],
    }).sort({ 'contents.date': 1 }).toArray()
    .then(function(entries) {
      context.logger.debug('Sending:', entries);
      res.status(200).send(entries.map(eventsTransforms.fromCollection));
    }).catch(next);
  }

  function eventControllerGet(req, res, next) {
    context.db.collection('events').findOne({
      $or: [{
        owner_id: castToObjectId(req.params.user_id),
      }, {
        'trip.friends_ids': castToObjectId(req.params.user_id),
      }],
      _id: castToObjectId(req.params.event_id),
    })
    .then(function(entry) {
      if(!entry) {
        return res.sendStatus(404);
      }
      res.status(200).send(eventsTransforms.fromCollection(entry));
    }).catch(next);
  }

  function eventControllerPut(req, res, next) {
    context.db.collection('events').findOne({
      'contents.type': 'trip-start',
      'contents.trip_id': castToObjectId(req.body.contents.trip_id),
    }).then(function(startEvent) {
      if(!startEvent) {
        return res.send(400);
      }
      return context.db.collection('events').findOneAndUpdate({
        _id: castToObjectId(req.params.event_id),
        owner_id: castToObjectId(req.params.user_id),
      }, {
        $set: {
          contents: eventsTransforms.toCollection(req.body).contents || {},
        },
        $setOnInsert: {
          _id: castToObjectId(req.params.event_id),
          owner_id: castToObjectId(req.params.user_id),
          trip: startEvent.trip,
        },
      }, {
        upsert: true,
        returnOriginal: false,
      })
      .then(function(result) {
        res.status(201).send(eventsTransforms.fromCollection(result.value));
      });
    })
    .catch(next);
  }

  function eventControllerDelete(req, res, next) {
    context.db.collection('events').deleteOne({
      _id: castToObjectId(req.params.event_id),
      owner_id: castToObjectId(req.params.user_id),
    })
    .then(function() {
      res.status(410).send();
    }).catch(next);
  }
}
