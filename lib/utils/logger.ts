/**
 * Structured logger for consistent error/info reporting across services.
 * Outputs JSON to stdout/stderr for easy parsing in production.
 */

type LogLevel = "info" | "warn" | "error";

interface LogContext {
  service: string;
  action?: string;
  userId?: string;
  agentId?: string;
  conversationId?: string;
  attemptId?: string;
  [key: string]: unknown;
}

function formatEntry(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
  const entry: Record<string, unknown> = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (error instanceof Error) {
    entry.error = error.message;
    entry.stack = error.stack;
  } else if (error !== undefined) {
    entry.error = String(error);
  }

  return entry;
}

function createLogger(defaultContext: LogContext) {
  return {
    info(message: string, extra?: Record<string, unknown>) {
      const entry = formatEntry("info", message, { ...defaultContext, ...extra });
      console.log(JSON.stringify(entry));
    },

    warn(message: string, extra?: Record<string, unknown>) {
      const entry = formatEntry("warn", message, { ...defaultContext, ...extra });
      console.warn(JSON.stringify(entry));
    },

    error(message: string, error?: unknown, extra?: Record<string, unknown>) {
      const entry = formatEntry("error", message, { ...defaultContext, ...extra }, error);
      console.error(JSON.stringify(entry));
    },
  };
}

/**
 * Create a scoped logger for a service.
 * Usage: const log = logger("chat"); log.error("Failed to send", err, { userId });
 */
export function logger(service: string) {
  return createLogger({ service });
}
