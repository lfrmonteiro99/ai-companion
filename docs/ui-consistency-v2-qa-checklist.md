# UI Consistency v2 QA Checklist

## Scope

- Dashboard, chat/scenario, feedback/results, history/replay, and micro-exercises visual consistency.
- Shared UI primitives usage (header/cards/buttons/states) in key surfaces.
- No translation/i18n scope changes.

## Functional

- Dashboard actions and links continue working.
- Chat send, stream, hint panel, and scenario completion interactions remain functional.
- Scenario complete and feedback screens still show score and penalty fields.
- History and replay links to analysis remain valid.
- Micro-exercises flow still works end-to-end (`next -> submit -> next`).

## Responsive

- Pages render correctly on narrow mobile widths.
- Composer/input controls remain usable in chat and exercises.
- Card content does not overflow with long text.

## Accessibility basics

- Interactive elements show clear focus states.
- Contrast remains acceptable on glass surfaces.
- Buttons keep disabled states and remain understandable.

## Regression

- No runtime errors in primary pages after UI pass.
- Existing scoring and progression behavior remains unchanged.
