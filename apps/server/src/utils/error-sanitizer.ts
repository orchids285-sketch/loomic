/**
 * Sanitize error messages before sending to the frontend.
 * Logs full error detail server-side, returns user-friendly message.
 */

const PROVIDER_PATTERN =
  /google|vertex|openai|replicate|langchain|gaxios|undici|fetch failed/i;
const DB_PATTERN =
  /supabase|postgres|pgmq|database|relation|column|constraint/i;
const AUTH_PATTERN =
  /jwt|token|unauthorized|forbidden|credential|service.account/i;
const INFRA_PATTERN =
  /econnrefused|econnreset|etimedout|dns|socket|tls|certificate/i;

export function sanitizeErrorForClient(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  // Log full detail server-side for debugging
  console.error("[error-sanitizer] Raw error:", raw);
  if (error instanceof Error) {
    // Log nested cause chain (LangChain wraps errors multiple levels deep)
    let cause = (error as any).cause;
    while (cause) {
      console.error("[error-sanitizer] Caused by:", cause.message ?? cause);
      cause = cause.cause;
    }
    // Log response details if present (Google API errors attach response/details)
    const errAny = error as any;
    if (errAny.response) {
      console.error("[error-sanitizer] Response status:", errAny.response.status);
      console.error("[error-sanitizer] Response data:", JSON.stringify(errAny.response.data ?? errAny.response.body ?? "").substring(0, 2000));
    }
    if (errAny.details) {
      console.error("[error-sanitizer] Details:", JSON.stringify(errAny.details).substring(0, 2000));
    }
    if (error.stack) {
      console.error("[error-sanitizer] Stack:", error.stack);
    }
  }

  // Map to user-friendly messages
  if (PROVIDER_PATTERN.test(raw)) {
    return "The AI service is unavailable right now. Please try again shortly.";
  }
  if (DB_PATTERN.test(raw)) {
    return "The data service is having trouble. Please try again shortly.";
  }
  if (AUTH_PATTERN.test(raw)) {
    return "Authentication failed. Refresh the page to continue.";
  }
  if (INFRA_PATTERN.test(raw)) {
    return "Network problem. Check your connection and try again.";
  }
  if (raw.includes("abort") || raw.includes("cancel")) {
    return "Request cancelled.";
  }
  if (raw.length > 100) {
    // Long messages are likely stack traces or JSON errors
    return "The request failed. Please try again.";
  }

  // Short, non-technical messages can pass through
  return "The request failed. Please try again.";
}
