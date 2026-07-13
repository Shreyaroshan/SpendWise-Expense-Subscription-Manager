import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import router from './auth.js';
import User from '../models/User.js';

const ORIGINALS = {
  findById: User.findById,
  findByIdAndUpdate: User.findByIdAndUpdate,
};

const SECRET = 'test-secret';
process.env.JWT_SECRET = SECRET;

const token = jwt.sign({ id: 'user-1' }, SECRET);

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', router);
  return app;
};

const restore = () => {
  User.findById = ORIGINALS.findById;
  User.findByIdAndUpdate = ORIGINALS.findByIdAndUpdate;
};

test('PUT /api/auth/profile updates profile settings fields', async () => {
  User.findById = () => ({
    select: async () => ({ _id: 'user-1', email: 'test@example.com' }),
  });

  User.findByIdAndUpdate = (id, updates) => ({
    select: async () => ({
      _id: id,
      email: 'test@example.com',
      name: updates.name,
      phoneNumber: updates.phoneNumber,
      avatarUrl: updates.avatarUrl,
      currency: updates.currency,
      timezone: updates.timezone,
      preferences: updates.preferences,
      notifPrefs: updates.notifPrefs,
    }),
  });

  const app = buildApp();
  const response = await request(app)
    .put('/api/auth/profile')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Shreya',
      phoneNumber: '+91 99999 99999',
      avatarUrl: 'https://example.com/avatar.png',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      preferences: { dateFormat: 'MM/DD/YYYY', weekStartsOn: 'Sunday', theme: 'light' },
      notifPrefs: {
        email: true,
        inApp: true,
        renewalReminder: true,
        budgetAlert: true,
        budgetAlert80: true,
        budgetAlert100: false,
        monthlySummary: true,
        alertThreshold: 75,
      },
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.name, 'Shreya');
  assert.equal(response.body.data.phoneNumber, '+91 99999 99999');
  assert.equal(response.body.data.avatarUrl, 'https://example.com/avatar.png');
  assert.equal(response.body.data.preferences.theme, 'light');

  restore();
});

test('PUT /api/auth/change-password updates password with correct current password', async () => {
  const oldHash = await bcrypt.hash('old-password', 10);
  let savedPassword = oldHash;

  User.findById = () => {
    const userDoc = {
      _id: 'user-1',
      email: 'test@example.com',
      password: savedPassword,
      save: async () => {
        savedPassword = userDoc.password;
      },
      select: async () => ({ _id: 'user-1', email: 'test@example.com' }),
    };

    return userDoc;
  };

  const app = buildApp();
  const response = await request(app)
    .put('/api/auth/change-password')
    .set('Authorization', `Bearer ${token}`)
    .send({ currentPassword: 'old-password', newPassword: 'new-password-123' });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.notEqual(savedPassword, oldHash);
  assert.equal(await bcrypt.compare('new-password-123', savedPassword), true);

  restore();
});

test('PUT /api/auth/change-password rejects invalid current password', async () => {
  const oldHash = await bcrypt.hash('old-password', 10);

  User.findById = () => ({
    _id: 'user-1',
    email: 'test@example.com',
    password: oldHash,
    save: async () => {},
    select: async () => ({ _id: 'user-1', email: 'test@example.com' }),
  });

  const app = buildApp();
  const response = await request(app)
    .put('/api/auth/change-password')
    .set('Authorization', `Bearer ${token}`)
    .send({ currentPassword: 'wrong-password', newPassword: 'new-password-123' });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);

  restore();
});
