const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

test('GET /health returns service status', async () => {
  const response = await request(app).get('/health').expect(200);
  assert.equal(response.body.success, true);
  assert.match(response.body.message, /Labour Mobility API/i);
  assert.ok(response.body.timestamp);
});

test('GET / responds with API metadata', async () => {
  const response = await request(app).get('/').expect(200);
  assert.equal(response.body.success, true);
  assert.match(response.body.message, /Welcome to Labour Mobility Management System API/i);
  assert.equal(response.body.documentation, '/api-docs');
  assert.equal(response.body.health, '/health');
});
