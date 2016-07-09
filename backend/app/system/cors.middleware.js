'use strict';

module.exports = initCors;

function initCors(context) {
  return function corsFunction(req, res, next) {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', context.env.CORS);
    res.header('Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Agent, Cookies'
    );
    res.header('Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    if('OPTIONS' === req.method) {
      res.status(200).send();
      return;
    }
    next();
  };
}
