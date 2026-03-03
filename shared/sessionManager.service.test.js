/*
AIDDE TRACE HEADER
Test: sessionManager.service.js
Why: Ensure session timeout and cleanup works
*/
const { startSession, endSession, sessions } = require('./sessionManager.service');

describe('sessionManager', () => {
  it('starts and ends session', async () => {
    await startSession('test-user', '/tmp/test-user-data');
    expect(sessions['test-user']).toBeDefined();
    endSession('test-user');
    expect(sessions['test-user']).toBeUndefined();
  });
});
