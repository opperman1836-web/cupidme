# CupidMe — Production Deployment Guide

## Architecture Overview

```
[Users] → [Vercel (Next.js Frontend)] → [Render (Express API)] → [Supabase (Database + Auth + Realtime)]
                                                                → [Stripe (Payments)]
                                                                → [Anthropic (AI)]
```

## Prerequisites

- GitHub repository with CupidMe code pushed
- Supabase account (https://supabase.com)
- Stripe account (https://stripe.com)
- Anthropic API key (https://console.anthropic.com)
- Vercel account (https://vercel.com)
- Render account (https://render.com)
- Domain name (e.g., cupidme.org)

---

## Step 1: Supabase Setup

1. Create a new Supabase project at https://supabase.com/dashboard
2. Go to **Settings → API** and copy:
   - Project URL (e.g., `https://abc123.supabase.co`)
   - `anon` public key
   - `service_role` key (keep this SECRET)
3. Go to **SQL Editor** and run the schema from `packages/db/schema.sql`
4. Verify tables are created in **Table Editor**
5. Go to **Authentication → URL Configuration**:
   - Set Site URL to your production frontend URL
   - Add redirect URLs for your domain

### Enable Realtime

Go to **Database → Replication** and enable realtime for these tables:
- `messages`
- `notifications`
- `duels`
- `duel_answers`

---

## Step 2: Deploy Backend (Render)

### Option A: Blueprint Deploy (Recommended)

1. Go to https://render.com/deploy
2. Connect your GitHub repository
3. Render auto-detects `apps/api/render.yaml`
4. Set environment variables in Render dashboard:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `API_PORT` | `4000` |
| `CORS_ORIGIN` | `https://cupidme.org,https://www.cupidme.org` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `STRIPE_SECRET_KEY` | `sk_live_...` from Stripe |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (set after step 2b) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` from Anthropic |
| `JWT_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `7d` |

5. Deploy and note your API URL (e.g., `https://cupidme-api.onrender.com`)

### Option B: Manual Deploy

1. In Render dashboard, click **New → Web Service**
2. Connect GitHub repo
3. Set:
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/server.js`
4. Set environment variables as above

### Verify Backend

```bash
curl https://YOUR-API-URL.onrender.com/api/health
# Should return: {"status":"ok","version":"1.0.0","environment":"production",...}
```

### Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click **Add endpoint**
3. URL: `https://YOUR-API-URL.onrender.com/api/webhooks/stripe`
4. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `payment_intent.succeeded`
5. Copy the webhook signing secret
6. Set it as `STRIPE_WEBHOOK_SECRET` in Render

---

## Step 3: Deploy Frontend (Vercel)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Set:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
4. Set environment variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Your Render API URL (e.g., `https://cupidme-api.onrender.com`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` from Stripe |

5. Deploy

### Verify Frontend

Visit your Vercel URL → should show the CupidMe landing page.

---

## Step 4: Connect Custom Domain

### Frontend (Vercel)

1. In Vercel dashboard → your project → Settings → Domains
2. Add `cupidme.org` and `www.cupidme.org`
3. Vercel provides DNS records to add

### DNS Configuration (HostAfrica or your registrar)

Add these DNS records:

| Type | Name | Value |
|------|------|-------|
| A | @ | `76.76.21.21` (Vercel) |
| CNAME | www | `cname.vercel-dns.com` |
| CNAME | api | Your Render URL (e.g., `cupidme-api.onrender.com`) |

### Backend Custom Domain (Optional)

If you want `api.cupidme.org`:
1. In Render dashboard → your service → Settings → Custom Domains
2. Add `api.cupidme.org`
3. Add the CNAME record above to your DNS

### Update Environment Variables

After domain setup:
1. **Render**: Update `CORS_ORIGIN` to `https://cupidme.org,https://www.cupidme.org`
2. **Supabase**: Update Site URL to `https://cupidme.org`
3. **Stripe**: Update webhook URL to use your custom domain

---

## Step 5: Post-Deployment Checklist

### Security
- [ ] JWT_SECRET is a unique 64+ character hex string
- [ ] No `.env` files committed to Git
- [ ] Supabase RLS policies are active
- [ ] Stripe is using LIVE keys (not test)
- [ ] CORS_ORIGIN is set to exact production domain(s)

### Functionality
- [ ] `/api/health` returns `{"status":"ok"}`
- [ ] Registration creates user in Supabase Auth
- [ ] Login returns access token
- [ ] Profile creation works
- [ ] Discover feed loads profiles
- [ ] Swipe right → like recorded
- [ ] Mutual like → match created
- [ ] Chat messages send and receive in realtime
- [ ] Duel creation deducts credit
- [ ] Duel questions load (AI or fallback)
- [ ] Stripe checkout creates session
- [ ] Webhook processes payment
- [ ] Invite link generates and accepts
- [ ] Notifications display in navbar

### Performance
- [ ] Frontend loads in under 3 seconds
- [ ] API responds in under 500ms
- [ ] Realtime messages appear within 1 second
- [ ] Images load from Supabase storage

---

## Monitoring

### Render
- View logs: Render Dashboard → your service → Logs
- Set up alerts: Render Dashboard → your service → Alerts

### Vercel
- View logs: Vercel Dashboard → your project → Deployments → Functions
- Analytics: Vercel Dashboard → your project → Analytics

### Supabase
- Database: Supabase Dashboard → Database → Logs
- Auth: Supabase Dashboard → Authentication → Logs
- Realtime: Supabase Dashboard → Realtime → Inspector

---

## Troubleshooting

### CORS Errors
- Ensure `CORS_ORIGIN` in Render matches your exact frontend URL
- Include both `https://cupidme.org` and `https://www.cupidme.org`

### Auth Not Working
- Check Supabase Auth → URL Configuration → Site URL matches frontend
- Verify `SUPABASE_ANON_KEY` is set in both frontend and backend

### Payments Failing
- Check Stripe Dashboard → Developers → Logs for webhook delivery
- Verify `STRIPE_WEBHOOK_SECRET` matches the endpoint secret
- Ensure webhook URL points to correct API URL

### Realtime Not Connecting
- Enable replication on `messages`, `notifications`, `duels`, `duel_answers` tables
- Check Supabase Realtime Inspector for connection status

---

## Scaling

When traffic grows:
1. **Render**: Upgrade plan (Starter → Standard → Pro)
2. **Supabase**: Upgrade plan for more connections and storage
3. **Vercel**: Auto-scales, but monitor serverless function limits
4. **Consider**: Add Redis for rate limiting across instances
