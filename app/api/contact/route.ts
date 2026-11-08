import { apiError, json, readJson } from "@/lib/api";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { validateContact } from "@/lib/validation";
import { saveMessage } from "@/services/messages/store";
import { notify } from "@/services/notifications/webhook";

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "contact"), 5, 10 * 60_000);
  if (!limit.ok) return apiError(429, "You've sent a few messages already. Please try again later.");

  let body: Record<string, unknown>;
  try {
    body = (await readJson(request, 8_000)) as Record<string, unknown>;
  } catch {
    return apiError(400, "Invalid request body.");
  }

  // Honeypot: real users never fill this hidden field.
  if (typeof body.company === "string" && body.company.length > 0) return json({ ok: true });

  const result = validateContact(body);
  if (!result.ok) return apiError(422, "Please check your message.", { fields: result.errors });

  try {
    await saveMessage("contact", result.data.email, { ...result.data });
    void notify("contact", { ...result.data });
  } catch (err) {
    console.error("[contact] failed to store message", err);
    return apiError(502, "We couldn't send your message right now. Please try again.");
  }
  return json({ ok: true }, 201);
}
