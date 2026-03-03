/*
AIDDE TRACE HEADER
File: workflowStream.api.test.js
Feature: API test for screenshot/video streaming endpoints
Why: Validate backend integration and endpoint responses
*/
const request = require('supertest');
const express = require('express');
const workflowStreamApi = require('./workflowStream.api');

describe('workflowStream.api', () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/', workflowStreamApi);
  });

  it('starts screenshot stream', async () => {
    const res = await request(app)
      .post('/stream/screenshot')
      .send({ userId: 'test-user', wsUrl: 'ws://localhost:1234', intervalMs: 500 });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('started');
  });

  it('starts video stream', async () => {
    const res = await request(app)
      .post('/stream/video')
      .send({ userId: 'test-user', wsUrl: 'ws://localhost:1234', inputSource: '/tmp/test.mp4' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('started');
  });
});
