'use strict';

var controllersUtils = {
  getDateSeal: controllersUtilsGetDateSeal,
};

module.exports = controllersUtils;

function controllersUtilsGetDateSeal(time, req) {
  var dateSeal = {
    seal_date: new Date(time),
  };

  if(req && req.user) {
    dateSeal.user_id = req.user_id;
  }
  if(req && req.ip) {
    dateSeal.ip = req.ip;
  }
  return dateSeal;
}
