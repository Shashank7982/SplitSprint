# SplitStream: 6-Day Portfolio Development Roadmap & Checklist

SplitStream is a full-stack group subscription cost-sharing platform that lets a **Host** create billing pools (e.g., Netflix, Spotify) and **Contributors** join and pay their share via Stripe test payments. A real-time **Trust Score** system tracks payment reliability.

This roadmap details the exact step-by-step checklist to build, test, and deploy this project in **6 days**.

---

## 📅 Day-by-Day Development Timeline

```
                     ┌──────────────────────────────────────────────┐
                     │  DAY 1: Project Setup, Database & Auth API   │
                     └──────────────────────┬───────────────────────┘
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │   DAY 2: Pools & Trust Score Calculation     │
                     └──────────────────────┬───────────────────────┘
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │     DAY 3: Stripe Payments & Webhook Setup   │
                     └──────────────────────┬───────────────────────┘
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │     DAY 4: Cron Jobs, Security & Testing     │
                     └──────────────────────┬───────────────────────┘
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │    DAY 5: Frontend Init, State & Auth/Dash   │
                     └──────────────────────┬───────────────────────┘
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │   DAY 6: Detail Pages, Stripe Checkout & Dep │
                     └──────────────────────────────────────────────┘
```

---

## 📁 Recommended File Directory Structure

Keep your codebase organized by adhering to this layout:

```text
splitstream/
├── Backend/
│   ├── database/
│   │   └── db.js              # Mongoose/MongoDB connection handler
│   ├── models/
│   │   ├── user.model.js       # User Schema
│   │   ├── pool.model.js       # Pool Schema
│   │   └── transaction.model.js# Transaction Schema
│   ├── services/
│   │   ├── auth.service.js     # JWT token generation / hash helpers
│   │   └── trust.service.js    # Trust score recalculation logic
│   ├── middleware/
│   │   ├── auth.middleware.js  # JWT validation & role-checking
│   │   ├── error.middleware.js # Global error handler
│   │   └── validate.js         # Input validation rules (express-validator)
│   ├── controllers/
│   │   ├── auth.controller.js  # Sign-up, Sign-in, Token refresh
│   │   ├── pool.controller.js  # Pool CRUD, join logic
│   │   └── payment.controller.js# Stripe PaymentIntent, confirm
│   ├── routes/
│   │   ├── auth.routes.js      # Auth router
│   │   ├── pool.routes.js      # Pools router
│   │   ├── payment.routes.js   # Stripe payment router
│   │   └── webhook.routes.js   # Stripe raw webhook router
│   ├── jobs/
│   │   └── cron.jobs.js        # node-cron reminders and retry scripts
│   ├── tests/
│   │   ├── unit/               # Jest unit tests for trust scores
│   │   └── integration/        # Supertest endpoint checks
│   ├── .env.example            # Environment templates
│   ├── package.json
│   └── server.js               # Entry point
│
└── Frontend/
    ├── public/
    ├── src/
    │   ├── components/         # Button, Input, Badges, Toast, Navbar
    │   ├── pages/
    │   │   ├── LandingPage.jsx # Hero & Call To Action
    │   │   ├── LoginPage.jsx   # Credentials sign-in
    │   │   ├── RegisterPage.jsx# Email sign-up
    │   │   ├── DashboardPage.jsx# User overview, pools, and score badge
    │   │   ├── BrowsePoolsPage.jsx# Listing, search filters, and sort
    │   │   ├── CreatePoolPage.jsx# Host form (slider, live split math)
    │   │   ├── PoolDetailPage.jsx# Member list, payment button, stripe form
    │   │   └── ProfilePage.jsx # Score dial, tips, history
    │   ├── store/
    │   │   ├── index.js        # Redux Toolkit Config
    │   │   ├── authSlice.js    # Auth state
    │   │   └── uiSlice.js      # Loader/Toast state
    │   ├── hooks/
    │   │   └── queries.js      # React Query custom hooks
    │   ├── services/
    │   │   └── api.js          # Axios configuration and base interceptors
    │   ├── App.jsx             # React Router routing setup
    │   ├── index.css           # Tailwind CSS imports & base styles
    │   └── main.jsx
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## 🗄️ Database Schemas (MongoDB / Mongoose)

You only need **three** collections. Let Mongoose object relations build the connections.

### 1. User (`users` collection)
```javascript
{
  _id: ObjectId,
  name: String,               // Required, 2-50 chars
  email: String,              // Required, unique, lowercase, regex-validated
  password: String,           // Bcrypt hashed (select: false in schema queries)
  trustScore: Number,         // Default: 100, range: 0-100
  stripeCustomerId: String,   // Generated via Stripe SDK on user sign-up
  role: String,               // Enum: ['user', 'admin'], default: 'user'
  createdAt: Date             // Default: Date.now
}
```

### 2. Pool (`pools` collection)
```javascript
{
  _id: ObjectId,
  hostId: ObjectId,           // Ref: User (The Pool Creator)
  serviceName: String,        // e.g. "Netflix", "Spotify"
  planTier: String,           // e.g. "Premium 4K", "Family Plan"
  totalCost: Number,          // In cents (Stripe format, e.g. 19900 for Rs.199)
  billingCycle: String,       // Enum: ['monthly', 'annual']
  slots: Number,              // Total slot capacity (2-6 for demo)
  shareAmount: Number,        // Auto-calculated (totalCost / slots)
  status: String,             // Enum: ['draft', 'active', 'closed'], default: 'active'
  members: [{
    userId: ObjectId,         // Ref: User
    role: String,             // Enum: ['host', 'contributor']
    joinedAt: Date,           // Default: Date.now
    status: String            // Enum: ['active', 'defaulted', 'left'], default: 'active'
  }],
  inviteCode: String,         // Unique 8-char alphanumeric (auto-generated)
  nextBillingDate: Date,      // Initialized to +1 month/year from creation
  createdAt: Date             // Default: Date.now
}
```

### 3. Transaction (`transactions` collection)
```javascript
{
  _id: ObjectId,
  poolId: ObjectId,           // Ref: Pool
  userId: ObjectId,           // Ref: User (The Contributor making the payment)
  type: String,               // Enum: ['contributor_debit', 'host_payout', 'refund']
  amount: Number,             // In cents
  status: String,             // Enum: ['pending', 'completed', 'failed'], default: 'pending'
  stripePaymentIntentId: String,// The PaymentIntent ID returned by Stripe API
  retryCount: Number,         // Default: 0, max retry limit: 3
  createdAt: Date             // Default: Date.now
}
```

---

## 🔌 API Endpoints Contract (10 Total)

| Method | Endpoint | Payload | Headers / Auth | Success Code | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | `{name, email, password}` | Public | `201 Created` | Creates account and calls `stripe.customers.create()` |
| **POST** | `/api/auth/login` | `{email, password}` | Public | `200 OK` | Verifies password; sets HttpOnly refresh cookie & returns accessToken |
| **POST** | `/api/auth/refresh` | None | Refresh Cookie | `200 OK` | Issues a new short-lived access token |
| **POST** | `/api/auth/logout` | None | Refresh Cookie | `200 OK` | Clears cookies |
| **POST** | `/api/pools` | `{serviceName, planTier, totalCost, billingCycle, slots}` | Access JWT | `201 Created` | Host sets up pool. Host automatically added as `members[0]` |
| **GET** | `/api/pools` | Query filters: `service`, `minPrice`, `maxPrice` | Access JWT | `200 OK` | Fetches active pools with available slots remaining |
| **GET** | `/api/pools/:id` | None | Access JWT | `200 OK` | Fetches single pool details + members info (populated names & scores) |
| **POST** | `/api/pools/:id/join` | `{inviteCode}` | Access JWT | `200 OK` | Contributor joins if invite code matches, slots open, and trust >= 50 |
| **POST** | `/api/payments/intent` | `{poolId}` | Access JWT | `200 OK` | Creates Stripe PaymentIntent and records a pending transaction |
| **POST** | `/webhooks/stripe` | Raw buffer bytes | Stripe Signature header | `200 OK` | Receives raw stripe events (`succeeded`, `failed`, `refunded`) |
| **GET** | `/api/health` | None | Public | `200 OK` | Health check route |

---

## 💳 Stripe & Webhook Flows

### Contributor Payment Sequence
```
Contributor           React App             Express API              Stripe API
   │                      │                      │                        │
   │─── Pay My Share ────>│                      │                        │
   │                      │── POST /payment/ ───>│                        │
   │                      │   intent (poolId)    │── stripe.payment ─────>│
   │                      │                      │   Intents.create()     │
   │                      │                      │<── client_secret ──────│
   │                      │<── client_secret ────│                        │
   │                      │    + txn_id          │                        │
   │                      │                      │                        │
   │─── Enters Card ─────>│                      │                        │
   │    & Submits         │── confirmCard ───────────────────────────────>│
   │                      │   Payment()          │                        │
   │                      │                      │<── Success/Failure ────│
   │<── Paid Status ──────│                      │                        │
   │                      │                      │                        │
   │                      │                      │<── webhook ────────────│
   │                      │                      │    (intent.succeeded)  │
   │                      │                      │                        │
   │                      │                      │── Update status:       │
   │                      │                      │   "completed",         │
   │                      │                      │   Trust Score: +2      │
```

### Stripe Webhook Handler Logic (`/webhooks/stripe`)
Use standard raw body parsing (`express.raw({ type: 'application/json' })`) to verify signatures.

```javascript
// Webhook handler mapping
switch (event.type) {
  case 'payment_intent.succeeded': {
    const intent = event.data.object;
    // 1. Locate transaction by stripePaymentIntentId
    // 2. Set transaction status to 'completed'
    // 3. Add +2 to User trustScore (Cap at 100)
    // 4. Update Pool details:
    //    If all contributors have now paid this month:
    //    Trigger Mocked Host Payout (payout = total collected * 0.95)
    //    Set nextBillingDate += 1 month
    break;
  }
  case 'payment_intent.payment_failed': {
    const intent = event.data.object;
    // 1. Locate transaction by stripePaymentIntentId
    // 2. Set transaction status to 'failed'
    // 3. Subtract -10 from User trustScore (Cap at 0)
    // 4. Leave nextBillingDate as-is to allow cron retry attempts
    break;
  }
  case 'charge.refunded': {
    const charge = event.data.object;
    // 1. Identify related transaction records
    // 2. Set transaction status to 'refunded'
    break;
  }
}
```

---

## 🛡️ Trust Score System Logic
Calculate the user's score on-the-fly dynamically from the transaction history or store a cached `trustScore` on the `User` schema that updates on specific events.

### The Rules
*   **On-Time Payment**: **`+2`** points. Triggered when Stripe webhook returns `payment_intent.succeeded` on the first retry count.
*   **Retry Success**: **`+1`** point. Triggered when payment succeeds on retry attempts (`retryCount > 0`).
*   **Payment Failed**: **`-10`** points. Triggered when payment fails after all 3 retries.
*   **Pool Default**: **`-25`** points. Triggered when a contributor is removed/flagged as defaulted in a pool.

### The Penalties/Tiers
*   **🟢 90 - 100 (Trusted)**: Access to all pools. Full privileges.
*   **🟡 70 - 89 (Good Standing)**: Access to normal pools.
*   **🟠 50 - 69 (Needs Improvement)**: Joining a pool requires host approval.
*   **🔴 < 50 (Restricted)**: **Banned** from joining any new pools.

---

## ⏰ Cron Jobs (2 Jobs Setup)

Use `node-cron` inside your Express entrypoint (`server.js`):

### 1. `billing-reminder`
*   **Schedule**: `0 9 * * *` (Daily 9:00 AM)
*   **Logic**:
    1. Query pools where `nextBillingDate` is exactly **tomorrow** (`Date` difference = 1 day).
    2. Collect contributor details.
    3. Log warning details directly to database or terminal (`console.log("[Reminder] Send billing warning to user ...")`).
    4. Optional: Create a "pending" transaction record for this next cycle.

### 2. `retry-failed`
*   **Schedule**: `0 10 * * *` (Daily 10:00 AM)
*   **Logic**:
    1. Query all transactions where `status === 'failed'` AND `retryCount < 3`.
    2. Trigger a programmatic retry charge using the saved customer token and card reference via Stripe:
       `stripe.paymentIntents.create({ customer: customerId, payment_method: pmId, confirm: true })`
    3. If retry succeeds:
       - Mark transaction `completed`.
       - Increment user trustScore by `+1`.
    4. If retry fails:
       - Increment `retryCount` by 1.
       - If `retryCount === 3`: subtract `-10` trust score from the user. Flag user's membership status in this pool as `defaulted`.

---

## 🛡️ Security Requirements

*   **JWT in httpOnly Cookies**: Store refresh tokens in secure cookies:
    ```javascript
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    ```
*   **Password Hashing**: Always hash passwords using `bcryptjs` with salt round **12** before storing.
*   **Request Validations**: Implement schemas validation middleware on routes using `express-validator`:
    ```javascript
    const { body } = require('express-validator');
    exports.registerRules = [
      body('email').isEmail().withMessage('Provide a valid email address'),
      body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ];
    ```
*   **Express Rate Limiting**: Limit spamming of critical routes (limit to 5 logins per 15 minutes, 100 API queries per minute).
*   **Helmet & CORS Config**: Set HTTP headers using `helmet()` and whitelist frontend origins.

---

## 📝 6-Day Development Task Checklist

### 🟩 Day 1: Setup, Database & Auth API
*   [ ] Run `npm init -y` inside `/Backend` directory and install Express, Mongoose, Dotenv, Bcryptjs, jsonwebtoken, cookie-parser, cors, helmet, stripe, and node-cron.
*   [ ] Configure database client connection file `Backend/database/db.js`.
*   [ ] Define schemas in `Backend/models/` for `User`, `Pool`, and `Transaction`.
*   [ ] Write JWT creation and verification utility helpers.
*   [ ] Implement auth validation middleware check rules.
*   [ ] Write authentication controllers: register, login, refresh, logout.
*   [ ] Mount routes in `server.js` and verify auth endpoints with Postman or Jest.

### 🟩 Day 2: Pools & Trust Score Engine
*   [ ] Write validation constraints for creating and joining pools.
*   [ ] Implement pool creation controller (automatic Host member role assignation, invite code generation).
*   [ ] Implement get pool detail endpoint.
*   [ ] Write list pools logic (with query filters for price range, slots remaining, and sorting).
*   [ ] Write pool join logic:
    *   Verify the invite code matches.
    *   Verify pool is active and slots are available.
    *   Query user's trust score. If `<50`, throw `403 Forbidden` error.
*   [ ] Write the dynamic trust score calculator utility.

### 🟩 Day 3: Stripe Payments & Webhooks
*   [ ] Initialize the Stripe SDK using developer test keys (`STRIPE_SECRET_KEY`).
*   [ ] Implement `/api/payments/intent` endpoint:
    *   Find the pool details and calculate user's share amount.
    *   Create a Stripe `PaymentIntent` for the amount.
    *   Create and save a new `Transaction` in the database with status `pending`.
    *   Return Stripe `client_secret` to client.
*   [ ] Implement the Stripe Webhook route handler `/webhooks/stripe` accepting raw bytes.
*   [ ] Connect webhook events listener:
    *   `payment_intent.succeeded` -> Update transaction status to `completed` and award user `+2` trust points. Check if pool is fully paid to calculate Host payouts.
    *   `payment_intent.payment_failed` -> Update transaction status to `failed` and deduct `-10` trust points.
    *   `charge.refunded` -> Update transaction status.

### 🟩 Day 4: Cron Jobs, Security & API Testing
*   [ ] Write cron scripts using `node-cron` running daily at 9:00 AM (billing warnings) and 10:00 AM (retry transaction queues).
*   [ ] Setup CORS configuration parameters restricting requests to client domain.
*   [ ] Set up rate limiters on credentials verification endpoints.
*   [ ] Write unit tests for trust score calculation metrics.
*   [ ] Write Express integration endpoints tests using Jest & Supertest.

### 🟩 Day 5: Frontend Bootstrap, State & Base Pages
*   [ ] Initialize a Vite React project in `/Frontend` folder: `npx create-vite@latest ./ --template react`.
*   [ ] Install packages: `redux`, `@reduxjs/toolkit`, `react-redux`, `@tanstack/react-query`, `axios`, `react-router-dom`, `lucide-react`, and `@stripe/stripe-js`.
*   [ ] Install Tailwind CSS and initialize configuration file.
*   [ ] Create Redux store slices for:
    *   `auth`: Manage current logged-in user profile data.
    *   `ui`: Manage error/success notification banners.
*   [ ] Create React Query wrapper and fetchers for pools directory listing.
*   [ ] Build Landing Page (Hero, Value Prop card designs, Call-to-action).
*   [ ] Build Login & Register forms. Store authenticated token cookie context on success.
*   [ ] Build Dashboard view (lists User's hosted pools, contributing pools, and displays a color-coded Trust Score dial).

### 🟩 Day 6: Detail Views, Stripe Element Checkouts & Production Deploy
*   [ ] Build Browse Pools page featuring filter cards and sorting sliders.
*   [ ] Build Create Pool Page:
    *   Form inputs: Service Name, Plan Tier, Total Monthly Cost.
    *   Include a slider for Slots (2-6).
    *   Implement real-time formula display: `Each member pays: (Total Cost / Slots)`.
*   [ ] Build Pool Details view:
    *   Display pool metadata (Service Name, Tier, Billing frequency).
    *   Render list of current members along with their individual Trust Scores.
    *   Implement "Join Pool" modal for non-members.
    *   Integrate Stripe `@stripe/react-stripe-js` payment form. Contributor clicks "Pay My Share" -> Stripe processing payment -> page details reload on success.
*   [ ] Deploy Express Backend application to Render (setup environment vars).
*   [ ] Deploy Frontend React application to Vercel.
*   [ ] Build final README.md file mapping development procedures.
