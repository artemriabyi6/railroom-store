/** Shared JSON helpers for route handlers. */
export function json<T>(body: T, init?: number | ResponseInit): Response {
  const opts = typeof init === "number" ? { status: init } : init;
  return Response.json(body, { ...opts, headers: { "Cache-Control": "no-store", ...(opts?.headers ?? {}) } });
}

export function apiError(status: number, error: string, extra?: Record<string, unknown>): Response {
  return json({ error, ...extra }, status);
}

export async function readJson(request: Request, maxBytes = 32_000): Promise<unknown> {
  const text = await request.text();
  if (text.length > maxBytes) throw new Error("payload_too_large");
  return JSON.parse(text);
}

/** Client-side helper: POST JSON and normalise errors. */
export async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<{ ok: true; data: T } | { ok: false; status: number; data: Record<string, unknown> }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return res.ok ? { ok: true, data: data as T } : { ok: false, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "network" } };
  }
}
