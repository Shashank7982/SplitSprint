# 🏃‍♂️ SplitSprint

SplitSprint (originally SplitStream) is a full-stack group subscription cost-sharing platform that simplifies dividing the bills for services like Netflix, Spotify, or YouTube Premium. A **Host** can create billing pools, and **Contributors** can join and pay their share. Real-time reliability is enforced using a dynamic **Trust Score** system.

---

## ✨ Features

- **Billing Pools**: Hosts set up subscription pools specifying the service, plan tier, billing cycle (monthly/annual), and total cost. The system automatically computes the individual share and generates a unique invite code.
- **Access Control & Trust Score**:
  - A real-time **Trust Score (0-100)** tracks payment reliability.
  - Users with score `< 50` are blocked from joining new pools.
  - Users with score `50-69` require host approval to join.
  - Users with score `70-100` join automatically.
- **Multiple Payment Workflows**:
  - **Credit Card Flow**: Simulated or live checkout using Stripe integrations.
  - **UPI Flow**: Contributors upload UPI payments, which Hosts verify before marking active.
- **Automated Cron Jobs**:
  - Daily reminders pre-create pending transaction bills.
  - Automatic retry of failed off-session payments (up to 3 times before defaulting user status and lowering trust scores).

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React.js (Vite development environment)
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit (Session and Toast/UI state)
- **Data Fetching**: Axios & React Query (for cache management)
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js & Express
- **Database**: MongoDB & Mongoose
- **Security**: Helmet, CORS, and Express-Rate-Limit
- **Authentication**: Access/Refresh token architecture using JSON Web Tokens (JWT) and HttpOnly secure cookies
- **Automation**: `node-cron`
- **Payments**: Stripe Node SDK

---

## 📂 Repository Structure

```text
SplitSprint/
├── Backend/                 # Node.js API server
│   ├── controllers/         # Request handling & business logic (Auth, Pools, Payments)
│   ├── database/            # Database connection configuration
│   ├── jobs/                # Background node-cron scheduling tasks
│   ├── middleware/          # JWT protection, Rate limiting, and validation rules
│   ├── models/              # Mongoose schemas (User, Pool, Transaction)
│   ├── routes/              # Express route declarations
│   ├── services/            # Core computation algorithms (Trust Score)
│   └── server.js            # Server entrypoint
├── Frontend/                # React (Vite) client application
│   ├── src/
│   │   ├── components/      # UI components (Button, Badge, Cards) & layouts
│   │   ├── hooks/           # React Query custom hooks
│   │   ├── pages/           # Page routes (Dashboard, Create/Browse Pools, Profile)
│   │   ├── services/        # API client configuration
│   │   └── store/           # Redux slices
│   ├── index.html           # HTML entrypoint
│   └── vite.config.js       # Vite build configurations
└── README.md                # Root guide file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- MongoDB Atlas account or local installation

### Setup & Configurations

#### 1. Clone the project and configure Backend `.env`
Create a `.env` file in the `/Backend` directory matching the following variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_uri
JWT_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_test_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
CLIENT_URL=http://localhost:5173
```

#### 2. Configure Frontend `.env`
Create a `.env` file in the `/Frontend` directory matching:
```env
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_test_key
```

### Installation & Run

#### Run the Backend
```bash
cd Backend
npm install
npm run dev
```
The server will boot on `http://localhost:5000`.

#### Run the Frontend
```bash
cd Frontend
npm install
npm run dev
```
The application will run locally on `http://localhost:5173`.
