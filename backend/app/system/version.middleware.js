'use strict';

const YHTTPError = require('yhttperror');

module.exports = initAgentVersionChecker;

function initAgentVersionChecker(context) {
  const agentsToCheck = context.env.AGENTS.split(',')
    .map(parseAgent);

  return function agentVersionChecker(req, res, next) {
    const agent = parseAgent(req.get('X-Agent'));

    if(agent.version.some(Number.isNaN)) {
      next(new YHTTPError(400, 'A_BAD_AGENT_VERSION', agent.version));
      return;
    }

    if(agentsToCheck.some(agentVersionIsDisabled.bind(null, agent))) {
      next(new YHTTPError(412, 'A_DISABLED_AGENT_VERSION', agent.version));
      return;
    }
    next();
  };
}

function parseAgent(agentString = '') {
  const parts = agentString.split(':');

  return {
    name: parts[0] || 'unknown',
    version: parts[1] ?
      parts[1].split('.').slice(0, 3).map((v) => { return Number.parseInt(v, 10); }) :
      [0, 0, 0],
  };
}

function agentVersionIsDisabled(agent, testedAgent) {
  if(agent.name !== testedAgent.name) {
    return false;
  }

  if(agent.version.every((version, level) => {
    return testedAgent.version[level] <= version;
  })) {
    return false;
  }

  return true;
}
