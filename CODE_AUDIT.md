# ExpenseTracker Backend — Code Audit

> **Audited:** 2026-07-13  
> **Scope:** `/backend/src` — all controllers, models, middleware, routes, utils, jobs

---

## Summary

Overall the code is well-structured with good separation of concerns, proper user-ownership checks, and deduplication logic for notifications. The issues below are grouped by severity.

---

## 🔴 Critical — Security / Data Exposure

### 1. Secrets committed in `.env`

**File:** `backend/.env`

The `.env` file contains **live production credentials** — MongoDB Atlas URI, Cloudinary API secret, Gmail SMTP app password, and a weak JWT secret — and sits unprotected in the project directory.

**Action required:**
- **Immediately rotate** all credentials (MongoDB password, Cloudinary key/secret, Gmail app password).
- Add `.env` to `.gitignore` and confirm it isn't already in git history.
- Use a strong, random JWT secret:

```bash
openssl rand -hex 64
```

```diff
- JWT_SECRET=spendwise_jwt_secret_key_2025
+ JWT_SECRET=<64-char-random-hex-string>
```

---

### 2. `updateExpense` passes raw `req.body` to MongoDB

**File:** `src/controllers/expenseController.js` — line 85

```js
const updated = await Expense.findOneAndUpdate(
  { _id: req.params.id, userId: req.user._id },
  req.body,   // ⚠️ entire body passed as update
  { returnDocument: 'after', runValidators: true }
);
```

An attacker can send `{ "userId": "other_user_id" }` to hijack ownership, or inject Mongoose operators like `$set`, `$push`, etc.

**Fix — whitelist allowed fields:**

```js
const { amount, categoryId, date, description,
        paymentMethod, isRecurring, recurringSchedule, receiptUrl } = req.body;

const updates = {};
if (amount !== undefined)            updates.amount = amount;
if (categoryId !== undefined)        updates.categoryId = categoryId;
if (date !== undefined)              updates.date = date;
if (description !== undefined)       updates.description = description;
if (paymentMethod !== undefined)     updates.paymentMethod = paymentMethod;
if (isRecurring !== undefined)       updates.isRecurring = isRecurring;
if (recurringSchedule !== undefined) updates.recurringSchedule = recurringSchedule;
if (receiptUrl !== undefined)        updates.receiptUrl = receiptUrl;
```

---

### 3. No rate limiting on auth endpoints

**File:** `src/server.js`

`/api/auth/login` and `/api/auth/register` have no brute-force protection — unlimited attempts are allowed.

**Fix:**

```bash
npm install express-rate-limit
```

```js
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

app.use('/api/auth', authLimiter);
```

---

### 4. JWT tokens are never invalidated

**File:** `src/controllers/authController.js` — line 5

Tokens are valid for 7 days with no revocation mechanism. A stolen token gives full account access for the remainder of its lifetime.

**Short-term fix:** Reduce expiry and add a refresh token flow, or maintain a server-side blocklist (Redis) for logout.

```js
// Reduce from 7d to 1h
jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
```

---

## 🟠 High — Logic / Data Integrity

### 5. `getUpcomingRenewals` — unbounded `days` parameter

**File:** `src/controllers/subscriptionController.js` — line 165

```js
const days = Math.max(1, Number(req.query.days || 7));
// No upper bound — caller can pass days=9999999
```

**Fix:**

```js
const days = Math.min(365, Math.max(1, Number(req.query.days || 7)));
```

---

### 6. `getExpenses` — `limit` parameter is not capped

**File:** `src/controllers/expenseController.js` — line 33

Passing `limit=100000` pulls the entire dataset in one request, causing memory spikes.

**Fix:**

```js
const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
```

---

### 7. No validation that `amount > 0` on expense creation

**File:** `src/controllers/expenseController.js` — `createExpense`  
**File:** `src/models/Expense.js`

The schema has no `min` validator, so negative, zero, `NaN`, or `Infinity` values are accepted.

**Fix in schema:**

```diff
- amount: { type: Number, required: true },
+ amount: { type: Number, required: true, min: [0.01, 'Amount must be a positive number'] },
```

**Fix in controller:**

```js
if (!amount || isNaN(amount) || Number(amount) <= 0)
  return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
```

---

### 8. 🐛 Route ordering bug — `/upload-receipt` and `/stats/*` are unreachable

**File:** `src/routes/expenses.js`

```js
router.route('/:id')           // ← registered first
  .put(updateExpense)
  .delete(deleteExpense);

router.post('/upload-receipt', ...);   // ← "upload-receipt" matches /:id ❌
router.get('/stats/by-category', ...); // ← "stats" matches /:id ❌
router.get('/stats/trends', ...);      // ← "trends" matches /:id ❌
```

Express matches routes **top-to-bottom**. These three endpoints are silently handled by the `/:id` handler instead.

**Fix — move specific routes before `/:id`:**

```js
router.post('/upload-receipt', uploadReceiptFile, uploadExpenseReceipt);
router.get('/stats/by-category', getStatsByCategory);
router.get('/stats/trends', getMonthlyTrends);

router.route('/:id')
  .put(updateExpense)
  .delete(deleteExpense);
```

---

### 9. `updateProfile` — no URL validation on `avatarUrl`

**File:** `src/controllers/authController.js` — line 82

`avatarUrl` is accepted as a plain string with no validation. An attacker can store `javascript:...` or a private-network URL.

**Fix:**

```js
if (avatarUrl !== undefined) {
  if (avatarUrl && !/^https:\/\//i.test(avatarUrl))
    return res.status(400).json({ success: false, message: 'avatarUrl must be an HTTPS URL' });
  updates.avatarUrl = avatarUrl;
}
```

---

### 10. `deleteCategory` — leaves orphaned expenses and budgets

**File:** `src/controllers/categoryController.js` — `deleteCategory`

Deleting a category leaves expenses and budgets referencing a non-existent `categoryId`. Aggregation pipelines with `$unwind` silently drop these records.

**Fix options (pick one):**
- **Block deletion** if the category is in use:
  ```js
  const inUse = await Expense.exists({ categoryId: category._id });
  if (inUse) return res.status(400).json({ success: false, message: 'Category is in use' });
  ```
- **Cascade:** reassign linked expenses/budgets to an "Other" category before deleting.

---

## 🟡 Medium — Reliability / Code Quality

### 11. `getMailer()` is duplicated across three files

**Files:** `budgetAlertService.js`, `renewalReminderService.js`, `cronJobs.js`

The same `nodemailer.createTransport` factory is copy-pasted three times. Extract it into a shared module:

```js
// src/utils/mailer.js
import nodemailer from 'nodemailer';

let _transporter = null;

export const getMailer = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  if (!_transporter) {
    _transporter = nodemailer.createTransport({ /* ... */ });
  }
  return _transporter;
};
```

---

### 12. Dead code — `createUniqueNotification` in `cronJobs.js`

**File:** `src/jobs/cronJobs.js` — lines 24–34

This function is defined but never called — both services already handle deduplication via `dedupeKey`. It should be removed to avoid confusion.

---

### 13. `getBudgetProgress` — database writes inside a GET handler

**File:** `src/controllers/budgetController.js` — lines 116–125

For every budget, a `Budget.updateOne` is fired on each GET request. This:
- Causes **N+1 write operations** on every page load
- Is semantically wrong (GET should be side-effect-free)
- Can cause **race conditions** on concurrent requests

**Fix:** Remove the `Budget.updateOne` from this handler. Update `currentPeriod.spent` only when an expense is created, updated, or deleted.

---

### 14. `monthlyTrends` ignores the `period` parameter

**File:** `src/controllers/analyticsController.js` — line 49

```js
const sixMonthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
// hardcoded to 6 months regardless of req.query.period
```

If a user selects `1Y`, `monthlyTrends` still only returns 6 months of data. The trend start date should respect `period`.

---

### 15. `isLocalDevOrigin` CORS bypass is not environment-gated

**File:** `src/server.js` — line 29

```js
const isLocalDevOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
```

Any localhost port on HTTP or HTTPS is allowed, regardless of `NODE_ENV`. If this reaches staging/production it becomes a CORS bypass.

**Fix:**

```js
const isLocalDevOrigin = (origin) =>
  process.env.NODE_ENV === 'development' &&
  /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
```

---

### 16. Upload MIME check is client-controlled (spoofable)

**File:** `src/middleware/uploadMiddleware.js`

```js
if (!file.mimetype.startsWith('image/')) { ... }
```

`mimetype` comes from the `Content-Type` header — it's set by the client and trivially faked. A malicious user can upload `.html` or `.svg` with `Content-Type: image/jpeg`.

**Fix:** Also validate the file extension, and consider using the `file-type` package to inspect the actual magic bytes:

```bash
npm install file-type
```

```js
import { fileTypeFromBuffer } from 'file-type';

const type = await fileTypeFromBuffer(req.file.buffer);
if (!type || !type.mime.startsWith('image/')) {
  return res.status(400).json({ success: false, message: 'Only image files are allowed' });
}
```

---

## 🟢 Minor

| # | Location | Issue |
|---|----------|-------|
| 17 | All controllers — `catch` blocks | `error.message` is sent verbatim to clients in 500 responses. In production this can leak DB schema/collection details. Use a generic message and log internally. |
| 18 | `expenseController.js` lines 1–4 | Two separate `import` lines for the same `cloudinary` module — consolidate into one. |
| 19 | `User.js` line 24 | `notifPrefs.alertThreshold` in the User model appears unused (threshold is on `Budget`). Remove or document it. |
| 20 | `Expense.js` line 13 | `recurringSchedule` enum includes `null`, which doesn't work correctly in Mongoose. Remove `null` from the enum array and rely on the `default: null`. |
| 21 | `budgetController.js` lines 197–200 | `deleteBudget` doesn't filter by `isActive`, so it can delete budgets from prior months. Confirm this is intentional. |

---

## ✅ Priority Action Checklist

- [ ] **Rotate ALL credentials in `.env` and add `.env` to `.gitignore`** ← do this first
- [ ] Fix route ordering in `expenses.js` — upload-receipt and stats routes are currently broken (#8)
- [ ] Whitelist fields in `updateExpense` — stop passing raw `req.body` (#2)
- [ ] Add `express-rate-limit` to auth routes (#3)
- [ ] Cap `limit` and `days` query parameters (#5, #6)
- [ ] Add `amount > 0` validation in `createExpense` and `Expense` schema (#7)
- [ ] Gate `isLocalDevOrigin` behind `NODE_ENV === 'development'` (#15)
- [ ] Remove DB writes from `getBudgetProgress` GET handler (#13)
- [ ] Remove dead `createUniqueNotification` from `cronJobs.js` (#12)
- [ ] Extract `getMailer()` into a shared `utils/mailer.js` singleton (#11)
