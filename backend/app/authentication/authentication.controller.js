'use strict';

var request = require('request');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var FacebookStrategy = require('passport-facebook');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var OAuth2Strategy = require('passport-oauth2');
var YError = require('yerror');
var castToObjectId = require('mongodb').ObjectId;

module.exports = initAuthenticationController;

function initAuthenticationController(context) {

  // Serialization
  passport.serializeUser(function(user, done) {
    context.logger.debug('Deserialized user:', user);
    done(null, user._id.toString());
  });
  passport.deserializeUser(function(id, done) {
    context.logger.debug('Serialized user:', id);
    done(null, { _id: id });
  });

  // Local login
  passport.use('local', new LocalStrategy({
    passReqToCallback: true,
  }, localLoginLogic));
  passport.use('local-signup', new LocalStrategy({
    passReqToCallback: true,
  }, localSignupLogic));
  passport.use(new BasicStrategy({
    passReqToCallback: true,
  }, localLoginLogic));
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: context.base + '/auth/facebook/callback',
    enableProof: false,
    profileFields: ['id', 'displayName', 'photos', 'emails'],
    passReqToCallback: true,
  }, facebookLoginLogic));
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: context.base + '/auth/google/callback',
    passReqToCallback: true,
  }, googleLoginLogic));
  passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: context.base + '/auth/twitter/callback',
    passReqToCallback: true,
  }, twitterLoginLogic));
  passport.use('xee', new OAuth2Strategy({
    authorizationURL: 'https://cloud.xee.com/v1/auth/auth',
    tokenURL: 'https://cloud.xee.com/v1/auth/access_token.json',
    clientID: process.env.XEE_ID,
    clientSecret: process.env.XEE_SECRET,
    callbackURL: context.base + '/auth/xee/callback',
    useAuthorizationHeaderForGET: true,
    passReqToCallback: true,
  }, xeeLoginLogic));

  function localLoginLogic(req, username, password, done) {
    context.logger.debug('Authentication attempt:', username, password);
    context.db.collection('users').findOne({
      'contents.email': username,
    }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.password === password) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      context.logger.info('Authenticated a user:', user._id, user.name);
      done(null, user);
    });
  }

  function localSignupLogic(req, username, password, done) {
    var upsertId = context.createObjectId();

    context.logger.debug('Sinup attempt:', req.body.username, upsertId);
    context.db.collection('users').findOne({
      'contents.email': username,
    }, function(err, user) {
      if (err) { return done(err); }
      if(user) { return done(new Error('E_EXISTS')); }
      if(!req.body.username) {
        return done(null, false, { message: 'Incorrect name.' });
      }
      context.logger.info('Registered a new user', username);
      context.db.collection('users').findOneAndUpdate({
        'contents.email': username,
      }, {
        $set: {
          contents: {
            name: req.body.username,
            email: username,
          },
        },
        $setOnInsert: {
          password: password,
          _id: upsertId,
          // Setting the PSA test car
          cars: [{
            _id: context.createObjectId(),
            type: 'psa',
            name: '206 Blanc Blanquise',
            vin: process.env.PSA_VIN,
            contract: process.env.PSA_CONTRACT,
            code: process.env.PSA_CODE,
          }],
        },
      }, {
        upsert: true,
        returnOriginal: false,
      }, function(err2, result) {
        if (err2) { return done(err); }
        done(null, result.value);
      });
    });
  }

  function facebookLoginLogic(req, accessToken, refreshToken, profile, done) {
    var upsertId = context.createObjectId();
    var findQuery = {};
    var updateQuery;

    context.logger.debug('Facebook auth info:', JSON.stringify(profile, null, 2), accessToken);

    if(!req._authState.contents) {
      return done(new YError('E_NO_STATE'));
    }

    updateQuery = {
      $set: {
        'contents.name': profile.displayName,
        'contents.email': profile.emails[0].value,
        'contents.photo': profile.photos[0].value,
        'auth.facebook': {
          id: profile.id,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
      },
    };

    if(req._authState.contents.user_id) {
      findQuery._id = castToObjectId(req._authState.contents.user_id);
    } else {
      findQuery.$or = [{
        'auth.facebook.id': profile.id,
      }, {
        'contents.email': { $in: profile.emails.map(function(email) {
          return email.value;
        }) },
      }];
      // It looks like Mongo can't recognize when an upsert is beeing processed...
      // So we avoid setting the upsert id ourself when we are sure the user exists.
      // MongoError: exception: After applying the update to the document
      // {_id: "xxx" , ...}, the (immutable) field '_id' was found to have
      // been altered to _id: ObjectId('yyy')
      updateQuery.$setOnInsert = {
        _id: upsertId,
      };
    }

    context.logger.info('findQuery', findQuery);

    context.db.collection('users').findOneAndUpdate(findQuery, updateQuery, {
      upsert: true,
      returnOriginal: false,
    }, function facebookLoginHandler(err, result) {
      if(err) {
        return done(err);
      }
      if(!result.lastErrorObject.updatedExisting) {
        context.logger.info(
          'Facebook signup:', profile.displayName,
          ' https://facebook.com/' + profile.id
        );
        context.bus.trigger({
          exchange: 'A_FB_SIGNUP',
          contents: {
            user_id: result.value._id,
          },
        });
      } else {
        context.bus.trigger({
          exchange: 'A_FB_LOGIN',
          contents: {
            user_id: result.value._id,
          },
        });
      }
      return done(err, result.value);
    });
  }

  function googleLoginLogic(req, accessToken, refreshToken, profile, done) {
    var upsertId = context.createObjectId();
    var findQuery = {};
    var updateQuery;

    context.logger.debug('Google auth info:', JSON.stringify(profile, null, 2), accessToken);

    if(!req._authState.contents) {
      return done(new YError('E_NO_STATE'));
    }

    updateQuery = {
      $set: {
        'contents.name': profile.displayName,
        'contents.email': profile.emails[0].value,
        'contents.photo': profile.photos[0].value,
        'auth.google': {
          id: profile.id,
          accessToken: accessToken,
          refreshToken: refreshToken,
          emails: profile.emails,
        },
      },
    };

    if(req._authState.contents.user_id) {
      findQuery._id = castToObjectId(req._authState.contents.user_id);
    } else {
      findQuery.$or = [{
        'auth.google.id': profile.id,
      }, {
        'contents.email': { $in: profile.emails.map(function(email) {
          return email.value;
        }) },
      }];
      // It looks like Mongo can't recognize when an upsert is beeing processed...
      // So we avoid setting the upsert id ourself when we are sure the user exists.
      // MongoError: exception: After applying the update to the document
      // {_id: "xxx" , ...}, the (immutable) field '_id' was found to have
      // been altered to _id: ObjectId('yyy')
      updateQuery.$setOnInsert = {
        _id: upsertId,
      };
    }

    context.db.collection('users').findOneAndUpdate(findQuery, updateQuery, {
      upsert: true,
      returnOriginal: false,
    }, function googleLoginHandler(err, result) {
      if(err) {
        return done(err);
      }
      if(!result.lastErrorObject.updatedExisting) {
        context.logger.info(
          'Google signup:', profile.displayName
        );
        context.bus.trigger({
          exchange: 'A_GG_SIGNUP',
          contents: {
            user_id: result.value._id,
          },
        });
      } else {
        context.bus.trigger({
          exchange: 'A_GG_LOGIN',
          contents: {
            user_id: result.value._id,
          },
        });
      }
      return done(err, result.value);
    });
  }

  function twitterLoginLogic(req, accessToken, refreshToken, profile, done) {
    var upsertId = context.createObjectId();
    var findQuery = {};
    var updateQuery;

    context.logger.debug('Twitter auth info:', JSON.stringify(profile, null, 2), accessToken);

    if(!req._authState.contents) {
      return done(new YError('E_NO_STATE'));
    }

    updateQuery = {
      $set: {
        'contents.name': profile.displayName,
        'contents.photo': profile.photos[0].value,
        'auth.twitter': {
          id: profile.id,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
      },
    };

    if(req._authState.contents.user_id) {
      findQuery._id = castToObjectId(req._authState.contents.user_id);
    } else {
      findQuery['auth.twitter.id'] = profile.id;
      // It looks like Mongo can't recognize when an upsert is beeing processed...
      // So we avoid setting the upsert id ourself when we are sure the user exists.
      // MongoError: exception: After applying the update to the document
      // {_id: "xxx" , ...}, the (immutable) field '_id' was found to have
      // been altered to _id: ObjectId('yyy')
      updateQuery.$setOnInsert = {
        _id: upsertId,
      };
    }

    context.db.collection('users').findOneAndUpdate(findQuery, updateQuery, {
      upsert: true,
      returnOriginal: false,
    }, function twitterLoginHandler(err, result) {
      if(err) {
        return done(err);
      }
      if(!result.lastErrorObject.updatedExisting) {
        context.logger.info(
          'Twitter signup:', profile.displayName, '- @starring',
          profile.username
        );
        context.bus.trigger({
          exchange: 'A_TWITTER_SIGNUP',
          contents: {
            user_id: result.value._id,
          },
        });
      } else {
        context.bus.trigger({
          exchange: 'A_TWITTER_LOGIN',
          contents: {
            user_id: result.value._id,
          },
        });
      }
      return done(err, result.value);
    });
  }

  function xeeLoginLogic(req, accessToken, refreshToken, profile, done) {
    var upsertId = context.createObjectId();

    if(!req._authState.contents) {
      return done(new YError('E_NO_STATE'));
    }

    new Promise(function(resolve, reject) {
      request.get(
      'https://cloud.xee.com/v1/user/me.json?access_token=' + accessToken,
      function(err, httpRes, httpData) {
        if(err) {
          return reject(err);
        }
        resolve(JSON.parse(httpData));
      });
    }).then(function(profile) {
      var findQuery = {};
      var updateQuery;

      context.logger.debug('Xee auth info:', JSON.stringify(profile, null, 2), accessToken);

      updateQuery = {
        $set: {
          contents: {
            name: profile.firstName + ' ' + profile.name,
          },
          'auth.xee': {
            id: profile.id,
            accessToken: accessToken,
            refreshToken: refreshToken,
          },
        },
      };

      if(req._authState.contents.user_id) {
        findQuery._id = castToObjectId(req._authState.contents.user_id);
      } else {
        findQuery['auth.xee.id'] = profile.id;
        // It looks like Mongo can't recognize when an upsert is beeing processed...
        // So we avoid setting the upsert id ourself when we are sure the user exists.
        // MongoError: exception: After applying the update to the document
        // {_id: "xxx" , ...}, the (immutable) field '_id' was found to have
        // been altered to _id: ObjectId('yyy')
        updateQuery.$setOnInsert = {
          _id: upsertId,
        };
      }

      context.db.collection('users').findOneAndUpdate(findQuery, updateQuery, {
        upsert: true,
        returnOriginal: false,
      }, function xeeLoginHandler(err, result) {
        if(err) {
          return done(err);
        }
        if(!result.lastErrorObject.updatedExisting) {
          context.logger.info(
            'Xee signup:', profile.firstName + ' ' + profile.name
          );
          context.bus.trigger({
            exchange: 'A_XEE_SIGNUP',
            contents: {
              user_id: result.value._id,
            },
          });
        } else {
          context.bus.trigger({
            exchange: 'A_XEE_LOGIN',
            contents: {
              user_id: result.value._id,
            },
          });
        }
        return done(err, result.value);
      });

    });
  }

  return passport;
}
