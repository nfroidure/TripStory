'use strict';

const controllersUtils = {
  getDateSeal: controllersUtilsGetDateSeal,
};

module.exports = controllersUtils;

function controllersUtilsGetDateSeal(time, req) {
  const dateSeal = {
    seal_date: new Date(time),
  };

  if(req && req.user) {
    dateSeal.user_id = req.user._id;
  }
  if(req && req.ip) {
    dateSeal.ip = req.ip;
  }
  return dateSeal;
}
