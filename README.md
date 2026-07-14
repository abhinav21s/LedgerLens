# LedgerLens — Monorepo

LedgerLens is a multi-tenant bank statement parser and transaction ledger web application built using Hono (Backend) and Next.js (Frontend). It allows users to parse messy bank statement text and record them in an organization-scoped secure ledger.

---

## 🛠️ Stack Overview
- **Backend:** Hono + TypeScript + Prisma ORM (v7) + PostgreSQL (Supabase)
- **Frontend:** Next.js 15 (App Router) + Tailwind CSS + shadcn/ui
- **Authentication:** Better Auth (Backend) + Auth.js (Frontend)

---

## 🚀 Running the Project

### 1. Backend Setup
Navigate to the `backend/` directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Configure your environment variables in `backend/.env` (see the Environment Variables section below).

Run the migrations to sync the database schema:
```bash
npx prisma migrate dev
```

Seed the database with two default test users and organizations:
```bash
npm run seed
```

Run integration tests (verifies auth, parser engine, tenant isolation, and pagination):
```bash
npm run test
```

Start the development server (runs on `http://localhost:4000`):
```bash
npm run dev
```

---

### 2. Frontend Setup
Navigate to the `frontend/` directory:
```bash
cd ../frontend
```

Install dependencies:
```bash
npm install
```

Configure your environment variables in `frontend/.env` (see the Environment Variables section below).

Start the development server (runs on `http://localhost:3000`):
```bash
npm run dev
```

---

## 🔑 Environment Variables Configuration

### Backend Environment Variables (`backend/.env`)
Create a `.env` file in the root of the `/backend` folder:
```env
# Backend Server Config
PORT=4000
ALLOWED_ORIGIN="http://localhost:3000"

# PostgreSQL Connection (Supabase / Neon)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres?sslmode=require"

# Better Auth Configuration
BETTER_AUTH_SECRET="a_very_secure_random_32_character_secret_key"
BETTER_AUTH_URL="http://localhost:4000"
```

### Frontend Environment Variables (`frontend/.env`)
Create a `.env` file in the root of the `/frontend` folder:
```env
# Frontend API endpoint config
NEXT_PUBLIC_API_URL="http://localhost:4000"

# Auth.js Configuration
AUTH_SECRET="a_very_secure_nextauth_secret_key_32_chars"
AUTH_URL="http://localhost:3000"
```

---

## 👥 Test User Credentials
The database seeding script creates two test users in separate, isolated organizations:

| User | Email | Password | Organization Created | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Alice** | `user.a@example.com` | `password123` | *User Alice's Org* | Owner |
| **Bob** | `user.b@example.com` | `password123` | *User Bob's Org* | Owner |

*You can run `npm run seed` in the `/backend` folder at any time to reset and re-seed these test users.*

---

## 🛡️ Multi-Tenant Isolation & Better Auth Integration

Our approach to multi-tenant isolation and scalability revolves around the **Better Auth Organization Plugin**, **Prisma database hooks**, and a **self-healing middleware fallback**:

1. **Auto-Provisioning Workspaces:** On user registration (`user.create.after` hook), a default personal organization is automatically provisioned for the user, and they are linked as the owner in the `Membership` join table.
2. **Session-Scoped Multi-Tenancy:** Upon login/session creation (`session.create.before` hook), we resolve the user's primary organization membership and inject it into the session data as `activeOrganizationId`. This ensures the active organization context is securely carried inside the authenticated session cookie.
3. **Self-Healing Fallback & Strict Query Scoping:** Downstream Hono routes use our authentication middleware to extract `activeOrganizationId`. If the ID is missing (e.g. during a newly registered session before hooks fully sync), the middleware automatically queries the user's membership database records, self-heals the session row, and scopes all queries securely, enforcing absolute isolation.
