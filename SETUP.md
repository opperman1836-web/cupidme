# CupidMe.org — Local Development Setup

## Prerequisites

- **Node.js** >= 20
- **npm** >= 10
- **Supabase CLI** (`npm install -g supabase`)
- **Stripe CLI** (optional, for webhook testing)

## 1. Install Dependencies

```bash
npm install
```

## 2. Environment Variables

### API (`apps/api/.env`)
Already created with Supabase local defaults. Update these values:

```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY       # From https://dashboard.stripe.com/test/apikeys
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET  # From Stripe CLI or dashboard
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY        # From https://console.anthropic.com
```

### Frontend (`apps/web/.env.local`)
Already created with defaults. Update:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
```

## 3. Database Setup

### Option A: Supabase Local (Recommended)

```bash
# Start Supabase locally (requires Docker)
npx supabase start

# Apply the schema
psql postgresql://postgres:postgres@localhost:54322/postgres < packages/db/schema.sql
```

Supabase local will start:
- **API**: http://localhost:54321
- **Studio**: http://localhost:54323
- **DB**: localhost:54322

The `.env` files already use these defaults.

### Option B: Supabase Cloud

1. Create a project at https://supabase.com
2. Go to SQL Editor → paste contents of `packages/db/schema.sql` → Run
3. Update `.env` files with your project URL and keys from Settings → API

## 4. Start Development Servers

### Start everything (with Turborepo):
```bash
npm run dev
```

### Or start individually:

```bash
# Terminal 1 — API (port 4000)
npm run dev:api

# Terminal 2 — Frontend (port 3000)
npm run dev:web
```

## 5. Access the App

- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:4000/api/health
- **Supabase Studio**: http://localhost:54323

## 6. Stripe Webhooks (Local Testing)

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

Copy the webhook signing secret to `apps/api/.env` as `STRIPE_WEBHOOK_SECRET`.

## 7. API Endpoints Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/refresh` | No | Refresh token |
| POST | `/api/auth/logout` | Yes | Logout |
| GET | `/api/users/me` | Yes | Get own profile |
| POST | `/api/users/profile` | Yes | Create profile |
| PATCH | `/api/users/profile` | Yes | Update profile |
| POST | `/api/users/photos` | Yes | Add photo |
| PUT | `/api/users/interests` | Yes | Set interests |
| GET | `/api/users/discover` | Yes | Discover feed |
| POST | `/api/matches/interest` | Yes | Express interest |
| GET | `/api/matches` | Yes | Get matches |
| GET | `/api/matches/:id` | Yes | Get match detail |
| GET | `/api/challenges` | Yes | Get challenges |
| POST | `/api/challenges/:id/submit` | Yes | Submit challenge |
| POST | `/api/chat/start` | Yes | Start chat room |
| POST | `/api/chat/:roomId/messages` | Yes | Send message |
| GET | `/api/chat/:roomId/messages` | Yes | Get messages |
| POST | `/api/chat/:roomId/extend` | Yes | Extend chat |
| POST | `/api/payments/checkout` | Yes | Create checkout |
| GET | `/api/payments/history` | Yes | Payment history |
| GET | `/api/payments/subscription` | Yes | Current subscription |
| GET | `/api/venues` | No | List venues |
| GET | `/api/venues/:id` | No | Venue detail |
| POST | `/api/venues` | Yes | Register venue |
| GET | `/api/venues/my/venues` | Yes | Owner's venues |
| POST | `/api/venues/offers` | Yes | Create offer |
| POST | `/api/venues/redemptions` | Yes | Generate QR |
| POST | `/api/venues/redemptions/redeem` | Yes | Redeem QR |
| GET | `/api/admin/*` | Admin | Admin endpoints |

## 8. Project Structure

```
cupidme/
├── apps/
│   ├── api/          # Express backend (port 4000)
│   └── web/          # Next.js frontend (port 3000)
├── packages/
│   ├── db/           # SQL schema
│   └── types/        # Shared TypeScript types
├── infra/            # nginx, PM2 configs
└── supabase/         # Supabase config
```

## 9. Production Build

```bash
npm run build
```

## 10. Production Deployment

```bash
# Uses PM2 for process management
pm2 start infra/pm2/ecosystem.config.js
```
