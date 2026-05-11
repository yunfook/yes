import "server-only";
import { randomBytes } from "node:crypto";

type StoredFile = {
  buffer: Buffer;
  filename: string;
  contentType: string;
  userId: number;
  expiresAt: number;
};

const TTL_MS = 10 * 60 * 1000;

const store = new Map<string, StoredFile>();

function sweep() {
  const now = Date.now();
  for (const [token, entry] of store) {
    if (entry.expiresAt < now) store.delete(token);
  }
}

export function putDownload(opts: {
  buffer: Buffer;
  filename: string;
  contentType?: string;
  userId: number;
}): string {
  sweep();
  const token = randomBytes(24).toString("base64url");
  store.set(token, {
    buffer: opts.buffer,
    filename: opts.filename,
    contentType:
      opts.contentType ??
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    userId: opts.userId,
    expiresAt: Date.now() + TTL_MS,
  });
  return token;
}

export function takeDownload(token: string, userId: number): StoredFile | null {
  sweep();
  const entry = store.get(token);
  if (!entry) return null;
  if (entry.userId !== userId) return null;
  store.delete(token);
  return entry;
}
