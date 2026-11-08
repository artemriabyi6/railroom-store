import "server-only";

/** Environment variable holding the webhook URL for each event kind. */
const WEBHOOKS = {
  contact: "CONTACT_WEBHOOK_URL",
  order: "ORDER_WEBHOOK_URL",
  newsletter: "NEWSLETTER_WEBHOOK_URL",
} as const;

export type EventKind = keyof typeof WEBHOOKS;

/**
 * Optional notification to Slack/Discord/Zapier/your backend. Data is always stored in
 * the database first (see services/messages and services/orders); this only forwards
 * a copy when the matching *_WEBHOOK_URL is configured. Never throws.
 */
export async function notify(kind: EventKind, payload: Record<string, unknown>): Promise<void> {
  const url = process.env[WEBHOOKS[kind]];
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, at: new Date().toISOString(), ...payload }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error(`[notify] ${kind} webhook responded with ${res.status}`);
  } catch (err) {
    console.error(`[notify] ${kind} webhook failed`, err);
  }
}
