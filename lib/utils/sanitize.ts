/**
 * Input sanitization for user messages before LLM injection.
 * Mitigates prompt injection by stripping control sequences and
 * marking user content with clear boundary markers.
 */

/** Maximum allowed message length in characters */
const MAX_MESSAGE_LENGTH = 2000;

/**
 * Strip characters that could be used for prompt injection or confuse the model.
 * - Removes control characters (except newline and tab)
 * - Strips XML/HTML-like tags that could mimic system prompt delimiters
 * - Trims and truncates to max length
 */
export function sanitizeUserMessage(message: string): string {
  let cleaned = message
    // Remove control characters except \n and \t
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Strip sequences that look like XML system prompt delimiters
    .replace(/<\/?(?:system|simulator_framework|global_rules|persona_voice|dynamic_state|forbidden|scenario_context|memories|examples|personality_calibration|reactions|texting_style)[^>]*>/gi, "")
    .trim();

  if (cleaned.length > MAX_MESSAGE_LENGTH) {
    cleaned = cleaned.slice(0, MAX_MESSAGE_LENGTH);
  }

  return cleaned;
}

/**
 * Wrap user message content with clear boundary markers for the prompt.
 * This helps the model distinguish user input from system instructions.
 */
export function wrapUserContent(content: string): string {
  return `[USER_MESSAGE_START]\n${content}\n[USER_MESSAGE_END]`;
}
