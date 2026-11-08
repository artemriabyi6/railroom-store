import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { DATA_DIR } from "@/services/storage/dataDir";

/** Environment variable holding the webhook URL for each event kind. */
const WEBHOOKS = {
  contact: "CONTACT_WEBHOOK_URL",
  order: "ORDER_WEBHOOK_URL",
  newsletter: "NEWSLETTER_WEBHOOK_URL",
} as const;

export type EventKind = keyof typeof WEBHOOKS;

/**
 * Delivers an event to a configured webhook (Slack/Discord/Zapier/your backend).
 * If no webhook is configured the event is appended to a local JSON-lines inbox
 * so that nothing submitted by customers is lost.
 */
export async function deliverEvent(kind: EventKind, payload: Record<string, unknown>): Promise<void> {
  const url = process.env[WEBHOOKS[kind]];
  const event = { kind, at: new Date().toISOString(), ...payload };

  if (url) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Webhook responded with ${res.status}`);
    return;
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.appendFile(path.join(DATA_DIR, `${kind}-inbox.jsonl`), JSON.stringify(event) + "\n", "utf8");
}
