'use strict';

var castToObjectId = require('mongodb').ObjectId;
var eventsTransforms = require('./events.transforms');
var controllersUtils = require('../utils/controllers');
var Promise = require('bluebird');
var YHTTPError = require('yhttperror');

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
    var query = {};

    if(req.params.user_id) {
      query.$or = [{
        owner_id: castToObjectId(req.params.user_id),
      }, {
        'trip.friends_ids': castToObjectId(req.params.user_id),
      }];
    }
    context.db.collection('events').find(query).sort({ 'created.seal_date': 1 }).toArray()
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
    Promise.resolve().then(function() {
      if(-1 !== ['trip-start'].indexOf(req.body.contents.type)) {
        throw new YHTTPError(400, 'E_UNCREATABLE_EVENT', req.params.event_id);
      }

      return context.db.collection('events').findOne({
        'contents.type': 'trip-start',
        'contents.trip_id': castToObjectId(req.body.contents.trip_id),
      });
    }).then(function(startEvent) {
      var dateSeal = controllersUtils.getDateSeal(context.time(), req);

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
        context.bus.trigger({
          exchange: 'A_TRIP_UPDATED',
          contents: {
            trip_id: result.value.contents.trip_id,
            event_id: result.value._id,
            users_ids: result.value.trip.friends_ids.concat(result.value.owner_id),
          },
        });
        res.status(201).send(eventsTransforms.fromCollection(result.value));
      });
    })
    .catch(next);
  }

  function eventControllerDelete(req, res, next) {
    context.db.collection('events').findOne({
      _id: castToObjectId(req.params.event_id),
      owner_id: castToObjectId(req.params.user_id),
    })
    .then(function(event) {
      if(!event) {
        return Promise.resolve();
      }
      if(-1 !== ['trip-start', 'trip-stop'].indexOf(event.contents.type)) {
        throw new YHTTPError(400, 'E_UNDELETABLE_EVENT', req.params.event_id);
      }
      return context.db.collection('events').deleteOne({
        _id: castToObjectId(req.params.event_id),
      })
      .then(function() {
        context.bus.trigger({
          exchange: 'A_TRIP_UPDATED',
          contents: {
            trip_id: event.contents.trip_id,
            event_id: castToObjectId(req.params.event_id),
            users_ids: event.trip.friends_ids.concat(event.owner_id),
          },
        });
      });
    }).then(function() {
      res.status(410).send();
    }).catch(next);
  }
}
