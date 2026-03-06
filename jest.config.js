// Feature: Jest Config | Trace: jest.config.js
// AIDDE TRACE HEADER
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.ts', '!**/workflow-websocket-server.test.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
