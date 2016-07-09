'use strict';

const assert = require('assert');
const sinon = require('sinon');
const initAgentVersionChecker = require('../../app/system/version.middleware');

describe('Version middleware', () => {
  const agentVersionChecker = initAgentVersionChecker({
    env: {
      AGENTS: 'MyAgent:1.0.0,AnotherAgent:0.0.0',
    },
  });
  let header;
  const req = {
    get: () => { return header; },
  };
  const res = {};
  let next;

  beforeEach(function() {
    next = sinon.spy();
  });

  it('should allow unknown agents', function() {
    agentVersionChecker(req, res, next);
    assert.equal(next.callCount, 1);
    assert.deepEqual(next.args, [[]]);
  });

  it('should allow equal version agents', function() {
    header = 'AnotherAgent:0.0.0';
    agentVersionChecker(req, res, next);
    assert.equal(next.callCount, 1);
    assert.deepEqual(next.args, [[]]);
  });

  it('should allow greater version agents', function() {
    header = 'AnotherAgent:0.1.1';
    agentVersionChecker(req, res, next);
    assert.equal(next.callCount, 1);
    assert.deepEqual(next.args, [[]]);
  });

  it('should allow greater version agents', function() {
    header = 'AnotherAgent:1.0.0';
    agentVersionChecker(req, res, next);
    assert.equal(next.callCount, 1);
    assert.deepEqual(next.args, [[]]);
  });

  it('should deny lower version agents', function() {
    header = 'MyAgent:0.1.0';
    agentVersionChecker(req, res, next);
    assert.equal(next.callCount, 1);
    assert.equal(next.args[0][0].httpCode, 412);
    assert.equal(next.args[0][0].code, 'A_DISABLED_AGENT_VERSION');
  });

});
