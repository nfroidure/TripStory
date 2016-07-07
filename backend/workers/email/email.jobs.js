'use strict';

const YError = require('yerror');
const Promise = require('bluebird');

const emailJobs = {
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
      subject: 'Welcome to Trip Story',
      html:
        '<p>Welcome to Trip Story!</p>\r\n' +
        '<p>We’re on a mission: <strong>help you to share amazing stories with friends</strong>. This should be easy.</p>\r\n' +
        '<p>Use Trip Story to connect all your social media and communicate with your friends.</p>\r\n' +
        '<p>We welcome your feedback, ideas and suggestions. We really want to make your life easier, so if we’re falling short or should be doing something different, we want to hear about it. Just reply to this email.</p>\r\n' +
        '<p>Thanks!</p>\r\n' +
        '<p>— The Trip Story crew</p>\r\n',
      text:
        'Welcome to Trip Story!\r\n\r\n' +
        'We’re on a mission: help you to share amazing stories with friends. This should be easy.\r\n\r\n' +
        'Use Trip Story to connect all your social media and communicate with your friends.\r\n\r\n' +
        'We welcome your feedback, ideas and suggestions. We really want to make your life easier, so if we’re falling short or should be doing something different, we want to hear about it. Just reply to this email.\r\n\r\n' +
        'Thanks!\r\n\r\n' +
        '— The Trip Story crew\r\n',
    });
  });
}

function emailFriendAddJob(context, event) {
  return Promise.all([
    _getRecipient(context, event.contents.friend_id),
    _getRecipient(context, event.contents.user_id),
  ])
  .spread((recipient, ccRecipient) => {
    const connectEndpoint = recipient.google ?
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
      subject: ccRecipient.contents.name + ' is ready to trip ✈ share memories with Trip Story',
      html:
        '<p>Hi ' + recipient.contents.name + '!</p>\r\n' +
        '<p>' +
          ccRecipient.contents.name + ' linked its account with you!' +
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
  return _getRecipient(context, event.contents.user_id).then(recipient => context.sendMail({
    from: context.env.EMAIL,
    to: event.contents.friend_email,
    subject: recipient.contents.name + ' has invited you to join Trip Story',
    html:
      '<p>Hi there!</p>\r\n' +
      '<p>' + recipient.contents.name + ' thought you may want to join Trip Story!</p>\r\n' +
      '<p><a href="' + context.base + '">' +
        'Join us to share your trips experiences!' +
      '</a></p>\r\n' +
      '<p><small>You may copy/paste this link into your browser: ' + context.base + '</small></p>\r\n' +
      '<p>See you soon</p>\r\n' +
      '<p>— The Trip Story crew</p>\r\n',
    text:
      'Hi!\r\n' +
      '\r\n' +
      recipient.contents.name + ' thought you may want to join Trip Story!\r\n' +
      '\r\n' +
      'Join us by browsing ' + context.base + '\u200B!\r\n',
  }));
}

function _getRecipient(context, recipientId) {
  return context.db.collection('users').findOne({
    _id: recipientId,
  }).then(recipient => {
    if(!recipient) {
      throw new YError('E_RECIPIENT_NOT_FOUND', recipientId);
    }
    if(!recipient.contents.email) {
      throw new YError('E_RECIPIENT_NO_MAIL', recipientId);
    }
    return recipient;
  });
}
