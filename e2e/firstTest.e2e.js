// Feature: E2E First Test | Trace: e2e/firstTest.e2e.js
// e2e/firstTest.e2e.js

describe('App Launch', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should show the main screen', async () => {
    await expect(element(by.id('main-screen'))).toBeVisible();
  });
});
