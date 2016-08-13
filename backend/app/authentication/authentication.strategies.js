'use strict';

const LocalStrategy = require('passport-local').Strategy;
const BasicStrategy = require('passport-http').BasicStrategy;
const JwtBearerStrategy = require('passport-http-jwt-bearer');
const castToObjectId = require('mongodb').ObjectId;
const authenticationUtils = require('./authentication.utils');
const Promise = require('bluebird');
const YHTTPError = require('yhttperror');

module.exports = initAuthenticationStrategies;

function initAuthenticationStrategies(context) {
  // Serialization
  context.passport.serializeUser((user, done) => {
    context.logger.debug('Serialized user:', user._id.toString());
    done(null, user._id.toString());
  });
  context.passport.deserializeUser((id, done) => {
    context.logger.debug('Deserialized user:', id);
    Promise.resolve(context.db.collection('users').findOne({
      _id: castToObjectId(id),
    }))
    .then(done.bind(null, null))
    .catch(done);
  });

  // Local strategies
  context.passport.use('local', new LocalStrategy({
    passReqToCallback: true,
    usernameField: 'email',
    passwordField: 'password',
  }, localLoginLogic));
  context.passport.use('local-signup', new LocalStrategy({
    passReqToCallback: true,
    usernameField: 'email',
    passwordField: 'password',
  }, localSignupLogic));
  context.passport.use(new BasicStrategy({
    passReqToCallback: true,
  }, localLoginLogic));

  if(context.env.JWT_SECRET) {
    context.passport.use('jwt', new JwtBearerStrategy(
      context.env.JWT_SECRET, {
        passReqToCallback: true,
      }, jwtLoginLogic));
  } else {
    context.logger.error('No JWT secret!');
  }

  // Logic
  function localLoginLogic(req, email, password, done) {
    context.logger.debug('Authentication attempt:', email);
    context.db.collection('users').findOne({
      emailKeys: { $all: [authenticationUtils.normalizeEmail(email)] },
    }, (err, user) => {
      if(err) {
        done(err);
        return;
      }
      if(!user) {
        done(null, false, { message: 'E_BAD_EMAIL' }, 400);
        return;
      }

      authenticationUtils.comparePasswordToHash(password, user.passwordHash)
        .then(matched => {
          if(!matched) {
            done(null, false, { message: 'E_BAD_PASSWORD' }, 400);
            return;
          }
          context.logger.info('Authenticated a user:', user._id, user.contents.name);
          done(null, user);
        }).catch(done);
    });
  }

  function localSignupLogic(req, email, password, done) {
    const upsertId = context.createObjectId();
    const name = req.body.name;

    context.logger.debug('Signup attempt:', email, name, upsertId);
    Promise.all([
      context.db.collection('users').findOne({
        emailKeys: { $all: [authenticationUtils.normalizeEmail(email)] },
      }),
      authenticationUtils.createPasswordHash(password),
    ]).spread((user, passwordHash) => {
      if(user) {
        throw new YHTTPError(400, 'E_USER_EXISTS', user._id);
      }
      if(!email) {
        return done(null, false, { message: 'E_BAD_EMAIL' }, 400);
      }
      if(!name) {
        return done(null, false, { message: 'E_BAD_NAME' }, 400);
      }
      context.logger.info('Registered a new user', email);
      return context.db.collection('users').findOneAndUpdate({
        emailKey: authenticationUtils.normalizeEmail(email),
      }, {
        $set: {
          contents: {
            name,
            email,
          },
          emailKeys: [authenticationUtils.normalizeEmail(email)],
        },
        $setOnInsert: {
          passwordHash,
          _id: upsertId,
          rights: authenticationUtils.createRights(),
        },
      }, {
        upsert: true,
        returnOriginal: false,
      }).then(result => {
        done(null, result.value);
      });
    }).catch(done);
  }

  function jwtLoginLogic(req, token, done) {
    const findQuery = {};

    context.logger.debug('JWT auth info:', token);

    try {
      findQuery._id = castToObjectId(token.sub);
    } catch (err) {
      done(YHTTPError.wrap(err, 400, 'E_BAD_USER_ID', token.sub));
      return;
    }

    context.db.collection('users').findOne(findQuery, (err, user) => {
      if(err) {
        done(YHTTPError.wrap(err, 500));
        return;
      }
      if(!user) {
        done(new YHTTPError(404, 'E_UNEXISTING_USER', token.sub));
        return;
      }
      context.bus.trigger({
        exchange: 'A_JWT_LOGIN',
        contents: {
          user_id: user._id,
          ip: req.ip,
        },
      });
      done(err, user);
      return;
    });
  }
}
