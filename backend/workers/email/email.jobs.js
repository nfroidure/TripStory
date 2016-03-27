'use strict';

var YError = require('yerror');

var emailJobs = {
  A_LOCAL_SIGNUP: emailSignupJob,
  A_FB_SIGNUP: emailSignupJob,
  A_GG_SIGNUP: emailSignupJob,
  A_TWITTER_SIGNUP: emailSignupJob,
  A_XEE_SIGNUP: emailSignupJob,
};

module.exports = emailJobs;

function emailSignupJob(context, event) {
  return context.db.collection('users').findOne({
    _id: event.contents.user_id,
  })
  .then(function sendSignupEmail(recipient) {
    if(!recipient) {
      throw new YError('E_RECIPIENT_NOT_FOUND', event.contents.user_id);
    }
    if(!recipient.contents.email) {
      throw new YError('E_RECIPIENT_NO_MAIL', event.contents.user_id);
    }

    return new Promise(function(resolve, reject) {
      context.mailer.sendMail({
        from: context.env.EMAIL,
        to: recipient.contents.email,
        subject: '[Trip Story] Welcome on board!',
        html:
          '<p>Hi ' + recipient.contents.name + '!</p>\r\n' +
          '<p>Welcome in the Trip Story community. Start tripping with friends!</p>\r\n' +
          '<p>See you soon !</p>\r\n',
        text:
          'Hi ' + recipient.contents.name + '!\r\n' +
          '\r\n' +
          'Welcome in the Trip Story community. Start tripping with friends!\r\n' +
          '\r\n' +
          'See you soon !\r\n',
      }, function sendMailHandler(err, info) {
        if(err) {
          return reject(err);
        }
        resolve(info);
      });
    });
  });
}
