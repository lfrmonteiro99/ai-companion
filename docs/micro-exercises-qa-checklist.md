# Micro Exercises QA Checklist

## Functional

- `GET /api/micro-exercises/next` returns one active exercise for authenticated users.
- `POST /api/micro-exercises/submit` persists attempt, score, penalties, and XP.
- MCQ exercises evaluate by option ID and return deterministic score.
- Rewrite exercise evaluates with token rubric and returns deterministic score.
- Result payload includes penalties and bonus breakdown fields.

## Rewards and Progression

- XP is awarded to `UserProgress` from micro exercise submit flow.
- No-hint bonus applies when `hintsUsed = 0`.
- First-attempt-of-day bonus applies only once per day.
- Hint and direct-hint penalties are reflected in score and XP.

## UX

- `/exercises` loads one-question flow end to end.
- Answer controls switch correctly between MCQ and text exercises.
- User can submit, see feedback, and move to next exercise.
- Dashboard Today Plan contains micro exercise quick-start action.

## Regression

- Scenario APIs and completion scoring remain functional.
- Dashboard payload remains stable with added micro insights.
- Existing history/replay routes continue responding.
