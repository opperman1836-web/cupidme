# CupidMe.org — Project Structure

> **Where Love Is Earned**

```
cupidme/
├── apps/
│   ├── web/                          # Next.js 14 Frontend
│   │   ├── public/
│   │   │   ├── icons/
│   │   │   ├── images/
│   │   │   └── manifest.json
│   │   ├── src/
│   │   │   ├── app/                  # App Router (Next.js 14)
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/
│   │   │   │   │   ├── register/
│   │   │   │   │   ├── verify/
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (main)/
│   │   │   │   │   ├── discover/
│   │   │   │   │   ├── matches/
│   │   │   │   │   ├── chat/
│   │   │   │   │   │   └── [matchId]/
│   │   │   │   │   ├── challenges/
│   │   │   │   │   │   └── [challengeId]/
│   │   │   │   │   ├── profile/
│   │   │   │   │   │   ├── edit/
│   │   │   │   │   │   └── [userId]/
│   │   │   │   │   ├── venues/
│   │   │   │   │   │   └── [venueId]/
│   │   │   │   │   ├── payments/
│   │   │   │   │   ├── settings/
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (venue)/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── offers/
│   │   │   │   │   ├── analytics/
│   │   │   │   │   ├── redemptions/
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (admin)/
│   │   │   │   │   ├── users/
│   │   │   │   │   ├── reports/
│   │   │   │   │   ├── payments/
│   │   │   │   │   ├── venues/
│   │   │   │   │   ├── challenges/
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx           # Landing page
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   │   ├── ui/                # Reusable primitives
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   ├── Avatar.tsx
│   │   │   │   │   ├── Badge.tsx
│   │   │   │   │   └── Toast.tsx
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   ├── RegisterForm.tsx
│   │   │   │   │   └── VerificationStep.tsx
│   │   │   │   ├── profile/
│   │   │   │   │   ├── ProfileCard.tsx
│   │   │   │   │   ├── PhotoUploader.tsx
│   │   │   │   │   ├── InterestPicker.tsx
│   │   │   │   │   └── ProfileEditor.tsx
│   │   │   │   ├── discover/
│   │   │   │   │   ├── DiscoverFeed.tsx
│   │   │   │   │   ├── ProfilePreview.tsx
│   │   │   │   │   └── InterestButton.tsx
│   │   │   │   ├── match/
│   │   │   │   │   ├── MatchList.tsx
│   │   │   │   │   ├── MatchCard.tsx
│   │   │   │   │   └── RelationshipMeter.tsx
│   │   │   │   ├── challenge/
│   │   │   │   │   ├── ChallengeCard.tsx
│   │   │   │   │   ├── ChallengeFlow.tsx
│   │   │   │   │   └── ChallengeResult.tsx
│   │   │   │   ├── chat/
│   │   │   │   │   ├── ChatWindow.tsx
│   │   │   │   │   ├── MessageBubble.tsx
│   │   │   │   │   ├── ChatInput.tsx
│   │   │   │   │   ├── ChatTimer.tsx
│   │   │   │   │   └── ChatExtendPrompt.tsx
│   │   │   │   ├── venue/
│   │   │   │   │   ├── VenueCard.tsx
│   │   │   │   │   ├── OfferCard.tsx
│   │   │   │   │   ├── QRScanner.tsx
│   │   │   │   │   └── VenueDashboard.tsx
│   │   │   │   ├── payment/
│   │   │   │   │   ├── PaymentModal.tsx
│   │   │   │   │   ├── PricingCard.tsx
│   │   │   │   │   └── SubscriptionManager.tsx
│   │   │   │   └── layout/
│   │   │   │       ├── Navbar.tsx
│   │   │   │       ├── Sidebar.tsx
│   │   │   │       ├── BottomNav.tsx
│   │   │   │       └── PageTransition.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useProfile.ts
│   │   │   │   ├── useMatches.ts
│   │   │   │   ├── useChat.ts
│   │   │   │   ├── useChallenge.ts
│   │   │   │   ├── usePayment.ts
│   │   │   │   ├── useVenue.ts
│   │   │   │   ├── useRealtime.ts
│   │   │   │   └── useRelationship.ts
│   │   │   ├── lib/
│   │   │   │   ├── supabase/
│   │   │   │   │   ├── client.ts
│   │   │   │   │   └── server.ts
│   │   │   │   ├── stripe.ts
│   │   │   │   ├── api.ts             # HTTP client wrapper
│   │   │   │   └── utils.ts
│   │   │   ├── stores/
│   │   │   │   ├── authStore.ts       # Zustand
│   │   │   │   ├── chatStore.ts
│   │   │   │   ├── matchStore.ts
│   │   │   │   └── notificationStore.ts
│   │   │   └── types/
│   │   │       ├── user.ts
│   │   │       ├── match.ts
│   │   │       ├── challenge.ts
│   │   │       ├── chat.ts
│   │   │       ├── payment.ts
│   │   │       ├── venue.ts
│   │   │       └── api.ts
│   │   ├── tailwind.config.ts
│   │   ├── next.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                           # Express Backend
│       ├── src/
│       │   ├── server.ts              # Express app bootstrap
│       │   ├── config/
│       │   │   ├── env.ts
│       │   │   ├── supabase.ts
│       │   │   ├── stripe.ts
│       │   │   └── claude.ts
│       │   ├── routes/
│       │   │   ├── index.ts
│       │   │   ├── auth.routes.ts
│       │   │   ├── user.routes.ts
│       │   │   ├── match.routes.ts
│       │   │   ├── challenge.routes.ts
│       │   │   ├── chat.routes.ts
│       │   │   ├── payment.routes.ts
│       │   │   ├── venue.routes.ts
│       │   │   ├── admin.routes.ts
│       │   │   └── webhook.routes.ts
│       │   ├── controllers/
│       │   │   ├── auth.controller.ts
│       │   │   ├── user.controller.ts
│       │   │   ├── match.controller.ts
│       │   │   ├── challenge.controller.ts
│       │   │   ├── chat.controller.ts
│       │   │   ├── payment.controller.ts
│       │   │   ├── venue.controller.ts
│       │   │   └── admin.controller.ts
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── user.service.ts
│       │   │   ├── match.service.ts
│       │   │   ├── challenge.service.ts
│       │   │   ├── relationship.service.ts
│       │   │   ├── chat.service.ts
│       │   │   ├── payment.service.ts
│       │   │   ├── venue.service.ts
│       │   │   ├── claude.service.ts   # AI moderation + challenge eval
│       │   │   └── notification.service.ts
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts
│       │   │   ├── rateLimit.middleware.ts
│       │   │   ├── validate.middleware.ts
│       │   │   ├── role.middleware.ts
│       │   │   └── error.middleware.ts
│       │   ├── validators/
│       │   │   ├── auth.validator.ts
│       │   │   ├── user.validator.ts
│       │   │   ├── match.validator.ts
│       │   │   ├── challenge.validator.ts
│       │   │   ├── payment.validator.ts
│       │   │   └── venue.validator.ts
│       │   ├── types/
│       │   │   ├── express.d.ts
│       │   │   └── index.ts
│       │   └── utils/
│       │       ├── logger.ts
│       │       ├── errors.ts
│       │       └── helpers.ts
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                        # Shared types & constants
│       ├── src/
│       │   ├── types/
│       │   │   ├── user.ts
│       │   │   ├── match.ts
│       │   │   ├── challenge.ts
│       │   │   ├── chat.ts
│       │   │   ├── payment.ts
│       │   │   ├── venue.ts
│       │   │   └── relationship.ts
│       │   ├── constants/
│       │   │   ├── challenges.ts
│       │   │   ├── pricing.ts
│       │   │   ├── relationship.ts
│       │   │   └── config.ts
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_users.sql
│   │   ├── 002_profiles.sql
│   │   ├── 003_matches.sql
│   │   ├── 004_challenges.sql
│   │   ├── 005_chat.sql
│   │   ├── 006_payments.sql
│   │   ├── 007_venues.sql
│   │   ├── 008_relationship_scores.sql
│   │   ├── 009_notifications.sql
│   │   ├── 010_admin.sql
│   │   └── 011_rls_policies.sql
│   ├── seed.sql
│   └── config.toml
│
├── infra/
│   ├── nginx/
│   │   ├── cupidme.conf
│   │   └── ssl/
│   ├── pm2/
│   │   └── ecosystem.config.js
│   └── scripts/
│       ├── deploy.sh
│       └── backup.sh
│
├── docs/
│   └── architecture/
│       ├── 01-PROJECT-STRUCTURE.md
│       ├── 02-DATABASE-SCHEMA.md
│       ├── 03-API-ARCHITECTURE.md
│       ├── 04-FRONTEND-ROUTES.md
│       └── 05-SERVICES.md
│
├── .env.example
├── .gitignore
├── package.json                       # Workspace root (npm workspaces)
├── turbo.json                         # Turborepo config
└── tsconfig.base.json
```

## Monorepo Strategy

**Tool:** npm workspaces + Turborepo

| Workspace | Path | Purpose |
|-----------|------|---------|
| `@cupidme/web` | `apps/web` | Next.js 14 frontend |
| `@cupidme/api` | `apps/api` | Express backend |
| `@cupidme/shared` | `packages/shared` | Shared types, constants, utilities |

## Key Architectural Decisions

1. **App Router** — Next.js 14 app directory with route groups `(auth)`, `(main)`, `(venue)`, `(admin)` for layout isolation.
2. **Separate backend** — Express API server runs independently from Next.js. Next.js handles SSR/SSG; Express handles all business logic, auth, and payment webhooks.
3. **Supabase as database + auth provider** — PostgreSQL with Row Level Security. Supabase client used directly for realtime subscriptions on frontend; all mutations go through Express API.
4. **Shared package** — Single source of truth for TypeScript types and business constants (pricing tiers, challenge rules, relationship thresholds).
5. **Zustand for client state** — Lightweight, no boilerplate. Server state handled via React Query (TanStack Query) + custom hooks.
