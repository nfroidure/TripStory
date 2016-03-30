'use strict';

var YError = require('yerror');
var Promise = require('bluebird');

var emailJobs = {
  A_LOCAL_SIGNUP: emailSignupJob,
  A_FB_SIGNUP: emailSignupJob,
  A_GG_SIGNUP: emailSignupJob,
  A_TWITTER_SIGNUP: emailSignupJob,
  A_XEE_SIGNUP: emailSignupJob,
  A_FRIEND_INVITE: emailFriendInviteJob,
  A_FRIEND_ADD: emailFriendAddJob,
};

module.exports = emailJobs;

function emailSignupJob(context, event) {
  return _getRecipient(context, event.contents.user_id)
  .then(function sendSignupEmail(recipient) {
    return context.sendMail({
      from: context.env.EMAIL,
      to: recipient.contents.email,
      subject: '[Trip Story] Welcome on board!',
      html:
        '<p>Hi ' + recipient.contents.name + '!</p>\r\n' +
        '<p>Welcome in the Trip Story community. Start tripping with friends!</p>\r\n' +
        '<p>See you soon, the Trip Story crew.</p>\r\n',
      text:
        'Hi ' + recipient.contents.name + '!\r\n' +
        '\r\n' +
        'Welcome in the Trip Story community. Start tripping with friends!\r\n' +
        '\r\n' +
        'See you soon, the Trip Story crew.\r\n',
    });
  });
}

function emailFriendAddJob(context, event) {
  return Promise.all([
    _getRecipient(context, event.contents.friend_id),
    _getRecipient(context, event.contents.user_id),
  ])
  .spread(function(recipient, ccRecipient) {
    var connectEndpoint = recipient.google ?
      '/auth/google' :
      recipient.facebook ?
      '/auth/facebook' :
      recipient.twitter ?
      '/auth/twitter' :
      recipient.xee ?
      '/auth/xee' :
      '';

    return context.sendMail({
      from: context.env.EMAIL,
      to: recipient.contents.email,
      cc: ccRecipient.contents.email,
      subject: '[Trip Story] ' + ccRecipient.contents.name + ' is ready to trip!',
      html:
        '<p>Hi there!</p>\r\n' +
        '<p>' +
          recipient.contents.name + ' linked its account with you!' +
          ' What a nice day to trip together :).' +
        '</p>\r\n' +
        '<p><a href="' + context.base + connectEndpoint + '">' +
          'Come on!' +
        '</a></p>\r\n' +
        '<p>See you soon, the Trip Story crew.</p>\r\n',
      text:
        'Hi!\r\n' +
        '\r\n' +
        recipient.contents.name + ' linked its account with you!\r\n' +
        ' What a nice day to trip together :).\r\n' +
        '\r\n' +
        'See you soon, the Trip Story crew.\r\n',
    });
  });
}

function emailFriendInviteJob(context, event) {
  return _getRecipient(context, event.contents.user_id).then(function(recipient) {
    return context.sendMail({
      from: context.env.EMAIL,
      to: event.contents.friend_email,
      subject: '[Trip Story] Invite from ' + recipient.contents.name + '!',
      html:
        '<p>Hi there!</p>\r\n' +
        '<p>' + recipient.contents.name + ' thought you may want to join Trip Story!</p>\r\n' +
        '<p><a href="' + context.base + '">' +
          'Join us to share your trips experiences!' +
        '</a></p>\r\n' +
        '<p>See you soon, the Trip Story crew.</p>\r\n',
      text:
        'Hi!\r\n' +
        '\r\n' +
        recipient.contents.name + ' thought you may want to join Trip Story!\r\n' +
        '\r\n' +
        'Join us by browsing ' + context.base + '!\r\n',
    });
  });
}

function _getRecipient(context, recipientId) {
  return context.db.collection('users').findOne({
    _id: recipientId,
  }).then(function(recipient) {
    if(!recipient) {
      throw new YError('E_RECIPIENT_NOT_FOUND', recipientId);
    }
    if(!recipient.contents.email) {
      throw new YError('E_RECIPIENT_NO_MAIL', recipientId);
    }
    return recipient;
  });
}
