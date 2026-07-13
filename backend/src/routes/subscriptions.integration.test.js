import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import router from './subscriptions.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';

const ORIGINALS = {
  find: Subscription.find,
  create: Subscription.create,
  findOneAndUpdate: Subscription.findOneAndUpdate,
  findOneAndDelete: Subscription.findOneAndDelete,
  userFindById: User.findById,
};

const SECRET = 'test-secret';
process.env.JWT_SECRET = SECRET;
const token = jwt.sign({ id: 'user-1' }, SECRET);

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/subscriptions', router);
  return app;
};

const restore = () => {
  Subscription.find = ORIGINALS.find;
  Subscription.create = ORIGINALS.create;
  Subscription.findOneAndUpdate = ORIGINALS.findOneAndUpdate;
  Subscription.findOneAndDelete = ORIGINALS.findOneAndDelete;
  User.findById = ORIGINALS.userFindById;
};

const stubUserLookup = () => {
  User.findById = () => ({
    select: async () => ({ _id: 'user-1', currency: 'INR' }),
  });
};

test('GET /api/subscriptions returns subscriptions list', async () => {
  stubUserLookup();

  Subscription.find = () => {
    const chain = {
      sort: async () => [{ _id: 's1', name: 'Netflix', amount: 499, status: 'active', billingCycle: 'monthly' }],
    };
    return chain;
  };

  const app = buildApp();
  const response = await request(app)
    .get('/api/subscriptions?status=active')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.length, 1);

  restore();
});

test('POST /api/subscriptions creates subscription', async () => {
  stubUserLookup();

  Subscription.create = async (payload) => ({ _id: 's2', ...payload });

  const app = buildApp();
  const response = await request(app)
    .post('/api/subscriptions')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Spotify', amount: 119, billingCycle: 'monthly' });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.name, 'Spotify');

  restore();
});

test('PUT /api/subscriptions/:id/status validates status', async () => {
  stubUserLookup();

  const app = buildApp();
  const response = await request(app)
    .put('/api/subscriptions/s1/status')
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'invalid' });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);

  restore();
});

test('GET /api/subscriptions/stats/total-cost computes totals', async () => {
  stubUserLookup();

  Subscription.find = async () => [
    { amount: 120, billingCycle: 'monthly' },
    { amount: 1200, billingCycle: 'yearly' },
  ];

  const app = buildApp();
  const response = await request(app)
    .get('/api/subscriptions/stats/total-cost')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.activeCount, 2);
  assert.equal(response.body.data.monthlyTotal, 220);
  assert.equal(response.body.data.yearlyTotal, 2640);

  restore();
});
