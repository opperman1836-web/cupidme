# CupidMe.org — Database Schema

> Supabase (PostgreSQL) with Row Level Security

---

## Entity Relationship Overview

```
users ──┬── profiles
        ├── user_photos
        ├── user_interests
        ├── user_verifications
        │
        ├── interests (expressed) ──► matches ──► challenges
        │                                    ──► chat_rooms ──► messages
        │                                    ──► relationship_scores
        │
        ├── payments ──► subscriptions
        │
        └── reports

venues ──┬── venue_offers
         ├── venue_subscriptions
         └── offer_redemptions
```

---

## 1. USERS & AUTH

### `users`
Managed by Supabase Auth. Extended with our profile table.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `email` | `text` | UNIQUE, NOT NULL |
| `phone` | `text` | UNIQUE, nullable |
| `role` | `enum('user','venue_owner','admin')` | DEFAULT `'user'` |
| `is_active` | `boolean` | DEFAULT `true` |
| `is_verified` | `boolean` | DEFAULT `false` |
| `last_seen_at` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | DEFAULT `now()` |
| `updated_at` | `timestamptz` | DEFAULT `now()` |

### `profiles`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `user_id` | `uuid` | FK → users.id, UNIQUE |
| `display_name` | `text` | NOT NULL, 2-50 chars |
| `bio` | `text` | max 500 chars |
| `date_of_birth` | `date` | NOT NULL |
| `gender` | `enum('male','female','non_binary','other')` | NOT NULL |
| `gender_preference` | `enum('male','female','non_binary','everyone')` | NOT NULL |
| `city` | `text` | NOT NULL |
| `province` | `text` | nullable |
| `country` | `text` | DEFAULT `'ZA'` |
| `latitude` | `decimal(10,7)` | nullable |
| `longitude` | `decimal(10,7)` | nullable |
| `max_distance_km` | `integer` | DEFAULT `50` |
| `age_range_min` | `integer` | DEFAULT `18` |
| `age_range_max` | `integer` | DEFAULT `50` |
| `profile_complete` | `boolean` | DEFAULT `false` |
| `created_at` | `timestamptz` | DEFAULT `now()` |
| `updated_at` | `timestamptz` | DEFAULT `now()` |

### `user_photos`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → users.id |
| `url` | `text` | NOT NULL |
| `position` | `integer` | NOT NULL (1-6) |
| `is_primary` | `boolean` | DEFAULT `false` |
| `created_at` | `timestamptz` | DEFAULT `now()` |

**Constraint:** UNIQUE(`user_id`, `position`), max 6 photos per user.

### `user_interests`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → users.id |
| `interest_tag` | `text` | NOT NULL |
| `category` | `text` | NOT NULL |

**Constraint:** UNIQUE(`user_id`, `interest_tag`), max 10 per user.

**Interest categories:** `lifestyle`, `hobbies`, `music`, `food`, `fitness`, `travel`, `values`, `goals`

### `user_verifications`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → users.id, UNIQUE |
| `selfie_url` | `text` | nullable |
| `status` | `enum('pending','approved','rejected')` | DEFAULT `'pending'` |
| `reviewed_by` | `uuid` | FK → users.id, nullable |
| `reviewed_at` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | DEFAULT `now()` |

---

## 2. MATCHING SYSTEM

### `interests` (expressed interest in another user)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `from_user_id` | `uuid` | FK → users.id |
| `to_user_id` | `uuid` | FK → users.id |
| `created_at` | `timestamptz` | DEFAULT `now()` |

**Constraint:** UNIQUE(`from_user_id`, `to_user_id`), CHECK(`from_user_id != to_user_id`)

**Trigger:** On INSERT, check if reverse interest exists → if yes, create match.

### `matches`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `user_a_id` | `uuid` | FK → users.id |
| `user_b_id` | `uuid` | FK → users.id |
| `status` | `enum('pending_challenge','challenge_active','unlocked','expired','unmatched')` | DEFAULT `'pending_challenge'` |
| `challenge_unlocked_at` | `timestamptz` | nullable |
| `chat_started_at` | `timestamptz` | nullable |
| `chat_expires_at` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | DEFAULT `now()` |
| `updated_at` | `timestamptz` | DEFAULT `now()` |

**Constraint:** UNIQUE pair (user_a_id < user_b_id enforced), CHECK(`user_a_id != user_b_id`)

**Index:** `idx_matches_users` on (`user_a_id`, `user_b_id`)

### Match Lifecycle:
```
mutual_interest → pending_challenge → challenge_active → unlocked → chat_started
                                                                   → expired (48h)
                                                                   → extended (paid)
```

---

## 3. CHALLENGE ENGINE

### `challenge_templates`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `category` | `enum('icebreaker','values','compatibility','fun','deep')` | NOT NULL |
| `question_text` | `text` | NOT NULL |
| `evaluation_criteria` | `jsonb` | NOT NULL |
| `difficulty` | `enum('easy','medium','hard')` | DEFAULT `'medium'` |
| `is_active` | `boolean` | DEFAULT `true` |
| `created_at` | `timestamptz` | DEFAULT `now()` |

`evaluation_criteria` example:
```json
{
  "type": "open_ended",
  "min_word_count": 20,
  "keywords_positive": ["honest", "thoughtful"],
  "ai_evaluation": true,
  "pass_threshold": 0.6
}
```

### `challenge_instances`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `match_id` | `uuid` | FK → matches.id |
| `template_id` | `uuid` | FK → challenge_templates.id |
| `assigned_to_user_id` | `uuid` | FK → users.id |
| `response_text` | `text` | nullable |
| `ai_score` | `decimal(3,2)` | nullable (0.00–1.00) |
| `ai_feedback` | `text` | nullable |
| `status` | `enum('pending','submitted','passed','failed')` | DEFAULT `'pending'` |
| `submitted_at` | `timestamptz` | nullable |
| `evaluated_at` | `timestamptz` | nullable |
| `expires_at` | `timestamptz` | NOT NULL |
| `created_at` | `timestamptz` | DEFAULT `now()` |

**Logic:** Both users in a match receive a challenge. Both must pass for chat to unlock.

---

## 4. RELATIONSHIP ENGINE

### `relationship_scores`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `match_id` | `uuid` | FK → matches.id, UNIQUE |
| `connection_level` | `integer` | DEFAULT `1` (1-10) |
| `trust_score` | `decimal(5,2)` | DEFAULT `0.00` (0–100) |
| `chemistry_score` | `decimal(5,2)` | DEFAULT `0.00` (0–100) |
| `depth_score` | `decimal(5,2)` | DEFAULT `0.00` (0–100) |
| `overall_score` | `decimal(5,2)` | GENERATED (computed) |
| `last_interaction_at` | `timestamptz` | nullable |
| `interaction_count` | `integer` | DEFAULT `0` |
| `created_at` | `timestamptz` | DEFAULT `now()` |
| `updated_at` | `timestamptz` | DEFAULT `now()` |

**Generated column:**
```sql
overall_score = (trust_score * 0.3) + (chemistry_score * 0.3) + (depth_score * 0.4)
```

### `relationship_events`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `match_id` | `uuid` | FK → matches.id |
| `event_type` | `enum('challenge_passed','message_sent','chat_extended','venue_date','photo_shared','deep_question')` | NOT NULL |
| `score_deltas` | `jsonb` | NOT NULL |
| `created_at` | `timestamptz` | DEFAULT `now()` |

`score_deltas` example:
```json
{
  "trust": +2.5,
  "chemistry": +1.0,
  "depth": +3.0,
  "connection_level_up": false
}
```

### Connection Level Thresholds

| Level | Name | Overall Score | Unlocks |
|-------|------|---------------|---------|
| 1 | Stranger | 0–10 | Challenge access |
| 2 | Acquaintance | 10–20 | Basic chat |
| 3 | Getting Comfortable | 20–35 | Photo sharing |
| 4 | Building Trust | 35–50 | Voice notes |
| 5 | Vibing | 50–60 | Video date |
| 6 | Strong Connection | 60–70 | Venue date suggestions |
| 7 | Deep Bond | 70–80 | Exclusive offers |
| 8 | Soulmate Track | 80–90 | Priority matching |
| 9 | Certified Match | 90–95 | Public couple profile |
| 10 | CupidMe Couple | 95–100 | Success story feature |

---

## 5. CHAT SYSTEM

### `chat_rooms`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `match_id` | `uuid` | FK → matches.id, UNIQUE |
| `status` | `enum('active','expired','extended','closed')` | DEFAULT `'active'` |
| `expires_at` | `timestamptz` | NOT NULL |
| `extended_count` | `integer` | DEFAULT `0` |
| `created_at` | `timestamptz` | DEFAULT `now()` |

### `messages`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `chat_room_id` | `uuid` | FK → chat_rooms.id |
| `sender_id` | `uuid` | FK → users.id |
| `content` | `text` | NOT NULL, max 2000 chars |
| `message_type` | `enum('text','image','voice_note','system')` | DEFAULT `'text'` |
| `is_read` | `boolean` | DEFAULT `false` |
| `moderation_status` | `enum('clean','flagged','blocked')` | DEFAULT `'clean'` |
| `created_at` | `timestamptz` | DEFAULT `now()` |

**Index:** `idx_messages_chatroom_created` on (`chat_room_id`, `created_at` DESC)

**Realtime:** Subscribed via Supabase Realtime on `messages` table filtered by `chat_room_id`.

---

## 6. PAYMENT SYSTEM

### `products`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `name` | `text` | NOT NULL |
| `type` | `enum('one_time','subscription')` | NOT NULL |
| `stripe_product_id` | `text` | UNIQUE |
| `stripe_price_id` | `text` | UNIQUE |
| `amount_zar` | `integer` | NOT NULL (in cents) |
| `description` | `text` | nullable |
| `is_active` | `boolean` | DEFAULT `true` |
| `created_at` | `timestamptz` | DEFAULT `now()` |

### Default Products

| Product | Type | Price (ZAR) |
|---------|------|-------------|
| Match Unlock | one_time | R29 |
| Chat Extension (24h) | one_time | R19 |
| CupidMe Plus (monthly) | subscription | R149/mo |
| CupidMe Premium (monthly) | subscription | R299/mo |
| Venue Basic (monthly) | subscription | R499/mo |
| Venue Pro (monthly) | subscription | R999/mo |

### `payments`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → users.id |
| `product_id` | `uuid` | FK → products.id |
| `match_id` | `uuid` | FK → matches.id, nullable |
| `stripe_payment_intent_id` | `text` | UNIQUE |
| `stripe_checkout_session_id` | `text` | nullable |
| `amount_zar` | `integer` | NOT NULL (cents) |
| `currency` | `text` | DEFAULT `'zar'` |
| `status` | `enum('pending','succeeded','failed','refunded')` | DEFAULT `'pending'` |
| `created_at` | `timestamptz` | DEFAULT `now()` |

### `subscriptions`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → users.id |
| `product_id` | `uuid` | FK → products.id |
| `stripe_subscription_id` | `text` | UNIQUE |
| `stripe_customer_id` | `text` | NOT NULL |
| `status` | `enum('active','past_due','canceled','trialing')` | NOT NULL |
| `current_period_start` | `timestamptz` | NOT NULL |
| `current_period_end` | `timestamptz` | NOT NULL |
| `cancel_at_period_end` | `boolean` | DEFAULT `false` |
| `created_at` | `timestamptz` | DEFAULT `now()` |
| `updated_at` | `timestamptz` | DEFAULT `now()` |

---

## 7. VENUE SYSTEM

### `venues`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `owner_id` | `uuid` | FK → users.id |
| `name` | `text` | NOT NULL |
| `description` | `text` | nullable |
| `category` | `enum('coffee_shop','restaurant','bar','activity','experience')` | NOT NULL |
| `address` | `text` | NOT NULL |
| `city` | `text` | NOT NULL |
| `province` | `text` | nullable |
| `latitude` | `decimal(10,7)` | NOT NULL |
| `longitude` | `decimal(10,7)` | NOT NULL |
| `phone` | `text` | nullable |
| `website` | `text` | nullable |
| `logo_url` | `text` | nullable |
| `cover_image_url` | `text` | nullable |
| `status` | `enum('pending','approved','rejected','suspended')` | DEFAULT `'pending'` |
| `approved_by` | `uuid` | FK → users.id, nullable |
| `approved_at` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | DEFAULT `now()` |
| `updated_at` | `timestamptz` | DEFAULT `now()` |

### `venue_offers`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `venue_id` | `uuid` | FK → venues.id |
| `title` | `text` | NOT NULL |
| `description` | `text` | NOT NULL |
| `offer_type` | `enum('percentage_discount','fixed_discount','free_item','special_menu')` | NOT NULL |
| `discount_value` | `decimal(5,2)` | nullable |
| `min_connection_level` | `integer` | DEFAULT `6` |
| `max_redemptions` | `integer` | nullable |
| `current_redemptions` | `integer` | DEFAULT `0` |
| `valid_from` | `timestamptz` | NOT NULL |
| `valid_until` | `timestamptz` | NOT NULL |
| `is_active` | `boolean` | DEFAULT `true` |
| `created_at` | `timestamptz` | DEFAULT `now()` |

### `offer_redemptions`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `offer_id` | `uuid` | FK → venue_offers.id |
| `match_id` | `uuid` | FK → matches.id |
| `redeemed_by_user_id` | `uuid` | FK → users.id |
| `qr_code` | `text` | UNIQUE, NOT NULL |
| `status` | `enum('generated','scanned','redeemed','expired')` | DEFAULT `'generated'` |
| `redeemed_at` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | DEFAULT `now()` |

### `venue_subscriptions`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `venue_id` | `uuid` | FK → venues.id |
| `product_id` | `uuid` | FK → products.id |
| `stripe_subscription_id` | `text` | UNIQUE |
| `status` | `enum('active','past_due','canceled','trialing')` | NOT NULL |
| `current_period_end` | `timestamptz` | NOT NULL |
| `created_at` | `timestamptz` | DEFAULT `now()` |
| `updated_at` | `timestamptz` | DEFAULT `now()` |

---

## 8. NOTIFICATIONS

### `notifications`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → users.id |
| `type` | `enum('match','challenge','chat','payment','venue','system')` | NOT NULL |
| `title` | `text` | NOT NULL |
| `body` | `text` | NOT NULL |
| `data` | `jsonb` | nullable |
| `is_read` | `boolean` | DEFAULT `false` |
| `created_at` | `timestamptz` | DEFAULT `now()` |

**Index:** `idx_notifications_user_unread` on (`user_id`) WHERE `is_read = false`

---

## 9. ADMIN & MODERATION

### `reports`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `reporter_id` | `uuid` | FK → users.id |
| `reported_user_id` | `uuid` | FK → users.id |
| `match_id` | `uuid` | FK → matches.id, nullable |
| `reason` | `enum('inappropriate','spam','harassment','fake_profile','other')` | NOT NULL |
| `description` | `text` | nullable |
| `status` | `enum('open','investigating','resolved','dismissed')` | DEFAULT `'open'` |
| `resolved_by` | `uuid` | FK → users.id, nullable |
| `resolution_note` | `text` | nullable |
| `created_at` | `timestamptz` | DEFAULT `now()` |
| `updated_at` | `timestamptz` | DEFAULT `now()` |

### `admin_audit_log`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `admin_id` | `uuid` | FK → users.id |
| `action` | `text` | NOT NULL |
| `target_type` | `text` | NOT NULL |
| `target_id` | `uuid` | NOT NULL |
| `details` | `jsonb` | nullable |
| `created_at` | `timestamptz` | DEFAULT `now()` |

---

## 10. ROW LEVEL SECURITY (RLS) POLICIES

```
-- Users can only read/update their own profile
profiles: SELECT WHERE user_id = auth.uid()
profiles: UPDATE WHERE user_id = auth.uid()

-- Users can see photos of users who appear in discover feed
user_photos: SELECT WHERE user_id = auth.uid() OR user_in_discover_feed(user_id)

-- Users can only see their own matches
matches: SELECT WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()

-- Users can only see messages in their chat rooms
messages: SELECT WHERE chat_room_id IN (SELECT id FROM chat_rooms WHERE match_id IN
  (SELECT id FROM matches WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()))

-- Users can only see their own payments
payments: SELECT WHERE user_id = auth.uid()

-- Venues: owners see their own, users see approved venues
venues: SELECT WHERE owner_id = auth.uid() OR status = 'approved'

-- Admin: full access with role check
ALL TABLES: ALL WHERE role = 'admin' (via service role key on backend)
```

---

## Indexes Summary

| Table | Index | Columns |
|-------|-------|---------|
| profiles | `idx_profiles_location` | `latitude, longitude` (for geo queries) |
| profiles | `idx_profiles_gender_pref` | `gender, gender_preference` |
| interests | `idx_interests_pair` | `from_user_id, to_user_id` |
| interests | `idx_interests_reverse` | `to_user_id, from_user_id` |
| matches | `idx_matches_users` | `user_a_id, user_b_id` |
| matches | `idx_matches_status` | `status` |
| challenge_instances | `idx_challenges_match` | `match_id` |
| messages | `idx_messages_room_time` | `chat_room_id, created_at DESC` |
| notifications | `idx_notif_user_unread` | `user_id WHERE is_read = false` |
| venue_offers | `idx_offers_venue_active` | `venue_id WHERE is_active = true` |
