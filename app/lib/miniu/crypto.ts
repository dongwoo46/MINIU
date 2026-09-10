import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function createId(prefix: string): string {
  return `${prefix}_${randomBytes(16).toString("hex")}`;
}

export function createInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let payload = "";
  for (let index = 0; index < 8; index += 1) {
    payload += alphabet[randomBytes(1)[0] % alphabet.length];
  }
  payload += alphabet[randomBytes(1)[0] % alphabet.length];
  let checksum = 0;
  for (let position = 0; position < payload.length; position += 1) {
    checksum += alphabet.indexOf(payload[position]) * (position + 3);
  }
  return `${payload}${alphabet[checksum % alphabet.length]}`;
}

export function hashLookupValue(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) {
    return false;
  }
  const actual = Buffer.from(hash, "hex");
  const expected = scryptSync(password, salt, 64);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
