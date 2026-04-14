# CupidMe — Complete Launch Guide

## ✅ ALREADY DONE:
- Supabase project created (edjitfeaojbxsfdjzzci)
- Stripe keys configured (sandbox mode)
- JWT secret set from Supabase
- Both .env files populated

## ⚠️ STILL NEEDED:
- Anthropic API key (paste full key in apps/api/.env)
- Database schema (run SQL in Supabase)

---

## STEP 1: Run Database Schema

Go to: https://supabase.com/dashboard/project/edjitfeaojbxsfdjzzci/sql/new

### Run #1: Base Schema
1. Open file `packages/db/schema.sql` on your computer
2. Select ALL text (Ctrl+A), copy (Ctrl+C)
3. Paste into the Supabase SQL editor
4. Click **Run** (or Ctrl+Enter)
5. ✅ Expected: "Success. No rows returned"

### Run #2: Duel System
1. Click **"New query"** (+ tab at top)
2. Open file `packages/db/migrations/003_duel_system.sql`
3. Copy ALL → paste → click **Run**
4. ✅ Expected: "Success. No rows returned"

### Run #3: Viral Invite System
1. Click **"New query"** (+ tab at top)
2. Open file `packages/db/migrations/004_viral_invite_system.sql`
3. Copy ALL → paste → click **Run**
4. ✅ Expected: "Success. No rows returned"

### Verify
Go to Table Editor (left sidebar). You should see 25+ tables including:
users, profiles, duels, duel_questions, duel_answers, duel_credits, invites, viral_metrics

---

## STEP 2: Add Anthropic Key

1. Open `apps/api/.env` in your editor
2. Replace `sk-ant-api03-Cr9_PASTE_FULL_KEY_HERE` with your full Anthropic key
3. Save

---

## STEP 3: Install & Run

Open terminal at project root:
```
cd "C:\Users\User\Desktop\CupidMe\cupidme-claude-dating-platform-architecture-rJlLe"
npm install
```

### Terminal 1 — API:
```
npm run dev:api
```
✅ Should show: `CupidMe API running on port 4000`

### Terminal 2 — Web:
```
npm run dev:web
```
✅ Should show: `Local: http://localhost:3000`

### Test:
- Open http://localhost:3000 → Landing page
- Open http://localhost:4000/api/health → `{"status":"ok"}`

---

## STEP 4: Test Flows

### Register:
1. Go to http://localhost:3000/register
2. Create account → should redirect to /discover

### Duel:
1. Go to /duel/invite
2. See credit balance and duel types

### Share (viral loop):
1. After a duel completes → result page shows Share card
2. Copy link → open in incognito → challenge page loads
3. New user signs up → both get +1 credit

---

## STEP 5: Deploy

### Frontend → Vercel
1. Push to GitHub
2. vercel.com → Import repo → Root: `apps/web`
3. Add env vars from `apps/web/.env.local`

### Backend → Render
1. render.com → New Web Service → Root: `apps/api`
2. Build: `npm install && npm run build`
3. Start: `node dist/server.js`
4. Add env vars from `apps/api/.env`
5. Set CORS_ORIGIN to your Vercel URL

### Stripe Webhook
1. Stripe Dashboard → Webhooks → Add endpoint
2. URL: `https://your-render-url/api/webhooks/stripe`
3. Events: checkout.session.completed, customer.subscription.*
4. Copy signing secret → add to Render env as STRIPE_WEBHOOK_SECRET

---

## Stripe Test Card
Number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
