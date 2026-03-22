# TASK 7: AUTOMATION & TRACKING SYSTEM

---

## SYSTEM THINKING: Work Smarter, Not Harder

### Core Principle: Build Once, Reuse Forever

---

## 1. CONTENT REUSE SYSTEM

### Content Library Structure:
```
/content-library/
  /ad-copy/
    - marketplace-ads.txt (3 variations)
    - group-posts.txt (3 variations)
    - gumtree-listings.txt (1 per city)
  /whatsapp/
    - broadcast-messages.txt (3 variations)
    - status-updates.txt (4 per day)
    - auto-replies.txt (all quick replies)
  /tiktok/
    - video-scripts.txt (5+ ideas)
    - captions-hashtags.txt
  /images/
    - offer-graphic.png
    - testimonial-templates.png
    - course-breakdown.png
    - urgency-countdown.png
  /scripts/
    - sales-scripts.txt (all 10 scripts)
    - objection-handlers.txt
    - payment-instructions.txt
```

### Rotation Strategy:
- **Week 1:** Use Versions A, B, C of all ad copy
- **Week 2:** Create Versions D, E, F based on what worked best
- **Week 3:** Combine best elements from all versions
- **Every post:** Rotate between story-led, direct offer, and question hook

### Content Refresh Schedule:
- Refresh ad copy every 5 days
- Create new TikTok concepts every 3 days
- Update WhatsApp statuses daily (never repeat same day)
- Change urgency triggers weekly ("30 spots" → "15 spots" → "5 spots")

---

## 2. LEAD TRACKING SYSTEM (Google Sheets)

### Sheet 1: Lead Database

| Column | Description | Example |
|--------|-------------|---------|
| A: Date | When lead came in | 22/03/2026 |
| B: Name | Full name | John Mokoena |
| C: Phone | WhatsApp number | 072 123 4567 |
| D: City | Location | Johannesburg |
| E: Province | Province | Gauteng |
| F: Source | Where they found us | Facebook Group |
| G: Status | Lead status | QUALIFIED |
| H: Employment | Current status | Unemployed |
| I: Interest Level | HOT/WARM/COLD | HOT |
| J: First Contact | Date of first message | 22/03 |
| K: Last Contact | Last interaction | 22/03 |
| L: Follow-Up Date | Next action date | 23/03 |
| M: Payment Status | NOT SENT/SENT/PARTIAL/PAID | SENT |
| N: Amount Paid | Amount received | R0 |
| O: Notes | Key info | "Wants to start Monday, asking about transport" |

### Sheet 2: Daily Dashboard

| Metric | Mon | Tue | Wed | Thu | Fri | Sat | Sun | TOTAL |
|--------|-----|-----|-----|-----|-----|-----|-----|-------|
| New Leads | | | | | | | | |
| Qualified | | | | | | | | |
| Payment Sent | | | | | | | | |
| Enrolled | | | | | | | | |
| Revenue | | | | | | | | |
| FB Posts | | | | | | | | |
| WA Messages | | | | | | | | |
| TikTok Views | | | | | | | | |

### Sheet 3: Conversion Funnel

```
Impressions (views) → Inquiries → Qualified → Payment Sent → Enrolled

Track conversion rate at each step:
- Impression → Inquiry: Target 2-5%
- Inquiry → Qualified: Target 60%
- Qualified → Payment Sent: Target 70%
- Payment Sent → Enrolled: Target 50%

Overall: Inquiry → Enrolled: Target 20-25%
(i.e., 1 enrollment per 4-5 inquiries)
```

---

## 3. AUTOMATED FOLLOW-UP SCHEDULE

### Follow-Up Sequence (Per Lead):

```
T+0 (Immediate):    Auto-reply with course info
T+2 hours:          Qualifying questions if no response
T+4 hours:          Follow-up #1 script
T+24 hours:         Follow-up #2 script (urgency)
T+48 hours:         Voice note / call
T+72 hours:         Final push script
T+7 days:           "Course is starting Monday" re-engagement
T+14 days:          "New batch opening" re-engagement
T+30 days:          "Special returnee offer" message
```

### WhatsApp Business Quick Reply Shortcuts:

| Shortcut | Message | When to Use |
|----------|---------|-------------|
| /welcome | Auto-reply + course info | New inquiry |
| /qualify | Qualifying questions | After welcome |
| /payment | Payment details | Qualified & ready |
| /followup1 | First follow-up | 4 hours no reply |
| /followup2 | Urgency follow-up | 24 hours no reply |
| /confirm | Enrollment confirmation | Payment verified |
| /plan | Payment plan options | Can't afford full |
| /nomatric | No matric needed response | Matric concern |
| /cert | Certificate info | Cert question |
| /referral | Referral request | After enrollment |

---

## 4. SCALE WHAT WORKS

### A/B Testing Framework:

**Test 1: Headlines**
- Version A: "Become a Certified Caregiver" → Track inquiries
- Version B: "Looking for a Job?" → Track inquiries
- Version C: "No Matric? No Problem!" → Track inquiries
- **Winner → Use in 70% of posts**

**Test 2: Price Presentation**
- Version A: "R2,000 (normally R5,500)" → Track conversions
- Version B: "Save R3,500 — pay only R2,000" → Track conversions
- Version C: "Less than R67/day for 30 days" → Track conversions
- **Winner → Use everywhere**

**Test 3: CTA**
- Version A: "WhatsApp CAREGIVER to..." → Track response rate
- Version B: "Comment INFO below" → Track response rate
- Version C: "Call now" → Track response rate
- **Winner → Default CTA**

**Test 4: Posting Times**
- Morning (7-8 AM) → Track engagement
- Midday (12-1 PM) → Track engagement
- Evening (6-7 PM) → Track engagement
- Late night (9-10 PM) → Track engagement
- **Winner → Double down on that time slot**

### Weekly Optimization Process:
1. Every Sunday: Review week's data
2. Identify top 3 performing posts/messages
3. Identify bottom 3 performing posts/messages
4. Next week: Scale top performers, replace bottom performers
5. Introduce 1-2 new test variations

---

## 5. SCALING ROADMAP

### Phase 1: Manual (Week 1-2) — R0 Budget
- All posting done manually
- WhatsApp Business for lead management
- Google Sheets for tracking
- Target: 15-20 enrollments per week (R30K-R40K)

### Phase 2: Semi-Automated (Week 3-4) — R500-R1,000 Budget
- Facebook Ads (R50/day for best-performing posts)
- WhatsApp Business API for auto-replies
- Google Form for lead capture
- Target: 30-40 enrollments per week (R60K-R80K)

### Phase 3: Systematic (Month 2) — R2,000-R5,000 Budget
- Facebook & Instagram Ads (R150/day)
- Landing page with lead capture
- Automated email sequence
- WhatsApp chatbot
- Referral programme launched
- Target: 50+ enrollments per week (R100K+)

### Phase 4: Scaled (Month 3+) — R5,000-R10,000 Budget
- Multi-channel paid ads (FB, IG, Google, TikTok)
- Full CRM system
- Sales team (commission-based)
- Student ambassador programme
- Target: 100+ enrollments per week (R200K+)

---

## 6. KEY METRICS TO TRACK DAILY

```
📊 DAILY SCORECARD

Date: ___________

TRAFFIC:
□ Facebook Group posts: ___/20
□ Marketplace listings active: ___/9
□ TikTok videos posted: ___/3
□ WhatsApp statuses: ___/4
□ Gumtree listings: ___/5

LEADS:
□ New inquiries today: ___
□ Leads qualified today: ___
□ Hot leads in pipeline: ___

SALES:
□ Payment details sent: ___
□ Payments received: ___
□ Revenue today: R___

FOLLOW-UPS:
□ Follow-ups sent: ___
□ Voice notes/calls made: ___
□ Leads re-engaged: ___

ENGAGEMENT:
□ Comments replied to: ___/all
□ DMs answered: ___/all
□ Response time avg: ___ min

NOTES/LEARNINGS:
_________________________________
_________________________________
```

---

## 7. EMERGENCY PLAYBOOK

### If leads are low:
1. Post in 10 MORE Facebook Groups immediately
2. Send WhatsApp broadcast to entire contact list
3. Change headline/angle (switch from "caregiver" to "earn R6K/month")
4. Post Marketplace in 5 new cities
5. Create "flash sale" urgency post

### If leads come but don't convert:
1. Review qualifying questions — are you filtering too hard?
2. Offer payment plan in first message
3. Add more social proof / testimonials
4. Call instead of text — personal touch
5. Reduce friction — "just send R500 to start"

### If payments are slow:
1. Send voice note (more personal)
2. Call directly
3. Offer to help with banking instructions
4. Create extreme urgency ("2 spots left — today only")
5. Offer small bonus for paying today

---

## READY-TO-GO CHECKLIST (DO THIS NOW)

- [ ] Set up WhatsApp Business profile
- [ ] Create all quick replies
- [ ] Set up Google Sheet tracker
- [ ] Save all ad copy variations to phone
- [ ] Create offer graphic (Canva — free)
- [ ] Join 20+ Facebook Groups
- [ ] Create Gumtree account
- [ ] Set up TikTok Business account
- [ ] Post first round of content
- [ ] Start messaging contacts
- [ ] **GO LIVE — START NOW**
