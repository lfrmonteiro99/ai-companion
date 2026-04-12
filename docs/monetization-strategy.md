# Monetization Strategy Analysis — Conversa

> Last updated: 2026-04-12

## Context

Conversa is a gamified social conversation simulator with 5 AI personalities, 25 scenarios, 20 micro-exercises, AI feedback, XP/leveling, and relationship progression. All features are currently free.

**Key cost driver**: OpenAI API calls (chat streaming, evaluation, feedback, hints, memory extraction). Each active user generates ~10-30 API calls per session.

---

## Strategy Options Evaluated

### 1. Freemium with Usage Limits ⭐ Recommended for MVP

**Model**: Free tier with daily limits + Premium tier with unlimited access.

| Feature | Free | Premium |
|---|---|---|
| Messages/day | 30 | Unlimited |
| Scenarios | 10 basic | All (25+) |
| Exercises/day | 3 | Unlimited |
| AI Feedback/day | 1 | Unlimited |
| Hints/session | 2 | Unlimited |
| Agents | 3 | 5 |
| Replay history | Last 7 days | Full |

**Price**: €5–9/month  
**Pros**: Proven model, easy to implement, free tier provides real value  
**Cons**: Must balance limits — too restrictive = abandonment, too generous = no conversions

### 2. Pay-per-Session (Token/Credit System)

**Model**: Buy credit packs; each session/feedback costs X credits.

**Pros**: Aligns cost with actual OpenAI usage  
**Cons**: Complex UX, creates spending anxiety, discourages engagement  
**Verdict**: Not recommended as primary model. Too much friction.

### 3. Premium Content Packs (IAPs)

**Model**: Themed scenario packs and challenge seasons as one-time purchases.

- "Date Logistics" pack (5 scenarios) — €2.99
- "Advanced Flirting" pack (5 scenarios) — €2.99
- "Relationship Recovery" pack (5 scenarios) — €2.99
- Monthly "Challenge Season" (new challenges) — €1.99/month

**Pros**: Low barrier, users buy what they want, good incremental revenue  
**Cons**: Requires continuous content production, fragments the experience

### 4. AI Coaching Premium Mode

**Model**: Special mode with real-time AI coaching during conversations.

- Real-time feedback during conversation (not just post-session)
- 3 alternative response suggestions per message
- "Replay coaching" — guided step-by-step session review
- Detailed communication profile with improvement plan

**Price**: €9–15/month  
**Pros**: High perceived value, hard to replicate, aligns with educational mission  
**Cons**: Higher OpenAI costs (more API calls), complex to implement

### 5. Subscription Tiers ⭐ Recommended long-term

| | Free | Pro (€7/mo) | Coach (€14/mo) |
|---|---|---|---|
| Messages/day | 30 | Unlimited | Unlimited |
| Agents | 3 | 5 | 5 |
| Scenarios | 10 basic | All | All + exclusives |
| Exercises/day | 3 | Unlimited | Unlimited |
| AI Feedback/day | 1 | Unlimited | Unlimited |
| Hints/session | 2 | 5 | Unlimited |
| Real-time coaching | — | — | Yes |
| Profile analysis | Basic | Detailed | Detailed + plan |
| Data export | — | Yes | Yes |

---

## Recommendation

### Phase 1 (MVP): Freemium with Stripe Checkout

Start with **Strategy 1** — simple free/premium split. Validates willingness to pay before investing in complex tier structures.

**Technical implementation**:
1. Add `tier` field to User model (`free` | `pro`)
2. Add `stripeCustomerId` and `stripeSubscriptionId` to User model
3. Stripe Checkout for monthly subscription
4. Stripe webhook endpoint to update tier on payment/cancellation
5. Usage-tracking middleware (daily message count, feedback count, etc.)
6. UI gates on components (locked scenarios, hint counter, upgrade prompts)
7. Upgrade prompt at limit boundaries (not hard blocks — show what they're missing)

### Phase 2: Add Coach Tier

Once Pro tier validates demand, add the Coach tier with:
- Real-time coaching overlay in chat
- Enhanced feedback with comparison analytics
- Priority model access (GPT-4o always, not just stage 2+)

### Phase 3: Content Packs

Once user base grows, add purchasable scenario packs as incremental revenue alongside subscriptions.

---

## Key Principles

1. **Free tier must be genuinely useful** — users should experience the full loop (chat → feedback → improve) before hitting limits
2. **Upgrade prompts at natural moments** — after a great session ("Want detailed feedback? Upgrade to Pro"), not as annoying popups
3. **No pay-to-win** — premium gives more access, not better AI responses
4. **Transparent pricing** — show exactly what each tier includes
5. **Easy cancellation** — Stripe handles this, but make it visible in settings

---

## Revenue Projections (Conservative)

| Metric | Month 3 | Month 6 | Month 12 |
|---|---|---|---|
| Monthly Active Users | 500 | 2,000 | 5,000 |
| Free → Pro conversion | 5% | 6% | 7% |
| Pro subscribers | 25 | 120 | 350 |
| MRR (€7/mo) | €175 | €840 | €2,450 |
| OpenAI cost/user/mo | ~€0.50 | ~€0.40 | ~€0.35 |
| Net margin | ~60% | ~65% | ~70% |

*Note: OpenAI cost decreases per user as model prices drop and caching improves.*
