import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import router from './notifications.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const ORIGINALS = {
  countDocuments: Notification.countDocuments,
  find: Notification.find,
  updateMany: Notification.updateMany,
  findOneAndUpdate: Notification.findOneAndUpdate,
  findOneAndDelete: Notification.findOneAndDelete,
  userFindById: User.findById,
};

const SECRET = 'test-secret';
process.env.JWT_SECRET = SECRET;

const token = jwt.sign({ id: 'user-1' }, SECRET);

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/notifications', router);
  return app;
};

const restore = () => {
  Notification.countDocuments = ORIGINALS.countDocuments;
  Notification.find = ORIGINALS.find;
  Notification.updateMany = ORIGINALS.updateMany;
  Notification.findOneAndUpdate = ORIGINALS.findOneAndUpdate;
  Notification.findOneAndDelete = ORIGINALS.findOneAndDelete;
  User.findById = ORIGINALS.userFindById;
};

const stubUserLookup = () => {
  User.findById = () => ({
    select: async () => ({ _id: 'user-1', email: 'test@example.com' }),
  });
};

test('GET /api/notifications returns paginated notifications', async () => {
  stubUserLookup();
  let receivedFilter;

  Notification.countDocuments = async (filter) => {
    receivedFilter = filter;
    return 1;
  };

  Notification.find = () => {
    const chain = {
      sort: () => chain,
      skip: () => chain,
      limit: async () => [
        {
          _id: 'n1',
          type: 'general',
          title: 'Welcome',
          message: 'Hello',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    return chain;
  };

  const app = buildApp();
  const response = await request(app)
    .get('/api/notifications?page=1&limit=20&unreadOnly=true')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.length, 1);
  assert.equal(response.body.pagination.page, 1);
  assert.deepEqual(receivedFilter, { userId: 'user-1', read: false });

  restore();
});

test('PUT /api/notifications/mark-all-read marks notifications', async () => {
  stubUserLookup();

  Notification.updateMany = async () => ({ modifiedCount: 3 });

  const app = buildApp();
  const response = await request(app)
    .put('/api/notifications/mark-all-read')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.modifiedCount, 3);

  restore();
});

test('PUT /api/notifications/:id/read marks one notification', async () => {
  stubUserLookup();

  Notification.findOneAndUpdate = async () => ({
    _id: 'n1',
    read: true,
    type: 'general',
    title: 'Welcome',
    message: 'Hello',
  });

  const app = buildApp();
  const response = await request(app)
    .put('/api/notifications/n1/read')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.read, true);

  restore();
});

test('DELETE /api/notifications/:id deletes one notification', async () => {
  stubUserLookup();

  Notification.findOneAndDelete = async () => ({ _id: 'n1' });

  const app = buildApp();
  const response = await request(app)
    .delete('/api/notifications/n1')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);

  restore();
});
