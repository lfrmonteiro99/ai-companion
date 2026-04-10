# Dashboard v2 QA Checklist

## Scope

- Action-first section order on home:
  - Continue Training
  - Progress Snapshot
  - Today's Plan
  - Skill Focus
  - Recent Sessions
  - Insights
  - Switch Character
- Adjusted score and hint penalties visible in recent sessions.
- Empty states for brand-new users render without runtime errors.

## Functional Checks

- Authenticated users can load `GET /api/dashboard`.
- Unauthenticated requests receive `401` from `GET /api/dashboard`.
- Continue Training CTA points to a valid route.
- Replay and Analysis links are valid for recent sessions.
- Switch Character chips navigate to corresponding chat routes.

## Responsive Checks

- Home remains readable at mobile widths.
- Card overflow does not break section layout.
- Switch Character chips wrap without clipping.

## Regression Checks

- Chat page loads and sends/streams messages.
- History page still renders session list.
- Replay and analysis pages remain accessible.
- Progress and profile-tier data still render correctly.
