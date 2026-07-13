import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import router from './budgets.js';
import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';
import User from '../models/User.js';

const ORIGINALS = {
  findOne: Budget.findOne,
  create: Budget.create,
  find: Budget.find,
  updateOne: Budget.updateOne,
  findOneAndDelete: Budget.findOneAndDelete,
  userFindById: User.findById,
  aggregate: Expense.aggregate,
};

const SECRET = 'test-secret';
process.env.JWT_SECRET = SECRET;
const token = jwt.sign({ id: 'user-1' }, SECRET);

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/budgets', router);
  return app;
};

const restore = () => {
  Budget.findOne = ORIGINALS.findOne;
  Budget.create = ORIGINALS.create;
  Budget.find = ORIGINALS.find;
  Budget.updateOne = ORIGINALS.updateOne;
  Budget.findOneAndDelete = ORIGINALS.findOneAndDelete;
  User.findById = ORIGINALS.userFindById;
  Expense.aggregate = ORIGINALS.aggregate;
};

const stubUserLookup = () => {
  User.findById = () => ({
    select: async () => ({ _id: 'user-1' }),
  });
};

test('POST /api/budgets creates budget', async () => {
  stubUserLookup();

  Budget.findOne = async () => null;
  Budget.create = async (payload) => ({
    _id: 'b1',
    ...payload,
    populate: async () => ({ _id: 'b1', ...payload, categoryId: { _id: payload.categoryId, name: 'Food' } }),
  });

  const app = buildApp();
  const response = await request(app)
    .post('/api/budgets')
    .set('Authorization', `Bearer ${token}`)
    .send({ categoryId: 'c1', amount: 5000, period: 'monthly', alertThreshold: 80 });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.amount, 5000);

  restore();
});

test('GET /api/budgets/progress returns computed progress', async () => {
  stubUserLookup();

  Budget.find = () => ({
    populate: async () => [
      {
        _id: 'b1',
        userId: 'user-1',
        categoryId: { _id: 'c1', name: 'Food' },
        amount: 5000,
        period: 'monthly',
        alertThreshold: 80,
      },
    ],
  });

  Expense.aggregate = async () => [{ spent: 2000 }];
  Budget.updateOne = async () => ({ acknowledged: true });

  const app = buildApp();
  const response = await request(app)
    .get('/api/budgets/progress')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.length, 1);
  assert.equal(response.body.data[0].spent, 2000);

  restore();
});

test('PUT /api/budgets/:id returns 404 when budget missing', async () => {
  stubUserLookup();

  Budget.findOne = async () => null;

  const app = buildApp();
  const response = await request(app)
    .put('/api/budgets/b1')
    .set('Authorization', `Bearer ${token}`)
    .send({ amount: 6000 });

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);

  restore();
});

test('DELETE /api/budgets/:id hard deletes budget', async () => {
  stubUserLookup();

  Budget.findOneAndDelete = async () => ({ _id: 'b1' });

  const app = buildApp();
  const response = await request(app)
    .delete('/api/budgets/b1')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);

  restore();
});
