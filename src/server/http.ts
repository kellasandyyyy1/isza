import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { z } from "zod";
import { MAX_PUSH_BODY_BYTES } from "@/lib/pushApi";

export const json = (body: object, status = 200) => Response.json(body, { status });

// Reads a JSON body of at most 8 KB and checks it with the schema. 413 when too big, 400 when invalid.
export async function readBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ ok: true; data: z.output<T> } | { ok: false; response: Response }> {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_PUSH_BODY_BYTES) {
    return { ok: false, response: json({ error: "Request too large." }, 413) };
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_PUSH_BODY_BYTES) {
    return { ok: false, response: json({ error: "Request too large." }, 413) };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, response: json({ error: "Invalid request." }, 400) };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, response: json({ error: "Invalid request." }, 400) };
  return { ok: true, data: parsed.data };
}

// "Authorization: Bearer <CRON_SECRET>", compared in constant time. False when no secret is set.
export function hasCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET ?? "";
  const header = request.headers.get("authorization") ?? "";
  // The header must be exactly "Bearer " followed by the secret.
  if (secret.length < MIN_CRON_SECRET_LENGTH || !header.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export const MIN_CRON_SECRET_LENGTH = 32;

// False when CRON_SECRET is missing or shorter than 32 characters. Never logs the value.
export function cronSecretConfigured(): boolean {
  return (process.env.CRON_SECRET ?? "").length >= MIN_CRON_SECRET_LENGTH;
}

// Logs what failed without request details, endpoints or keys.
export function serverError(where: string, error: unknown): Response {
  console.error(`[push] ${where} failed: ${error instanceof Error ? error.message : "unknown error"}`);
  return json({ error: "Something went wrong." }, 500);
}
