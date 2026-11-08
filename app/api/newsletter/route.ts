import { apiError, json, readJson } from "@/lib/api";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { isEmail } from "@/lib/validation";
import { saveMessage } from "@/services/messages/store";
import { notify } from "@/services/notifications/webhook";

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "newsletter"), 5, 10 * 60_000);
  if (!limit.ok) return apiError(429, "Too many attempts. Please try again later.");

  let body: Record<string, unknown>;
  try {
    body = (await readJson(request, 2_000)) as Record<string, unknown>;
  } catch {
    return apiError(400, "Invalid request body.");
  }

  // Honeypot field: silently accept bots without storing anything.
  if (typeof body.company === "string" && body.company.length > 0) return json({ ok: true });

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!isEmail(email)) return apiError(422, "Enter a valid email address.", { fields: { email: "Enter a valid email address." } });

  try {
    const isNew = await saveMessage("newsletter", email, { source: "homepage" });
    if (isNew) void notify("newsletter", { email });
  } catch (err) {
    console.error("[newsletter] failed to store signup", err);
    return apiError(502, "We couldn't sign you up right now. Please try again.");
  }
  return json({ ok: true }, 201);
}
