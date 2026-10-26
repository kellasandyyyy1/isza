// App lock PIN. Only a salted SHA-256 hash is stored, never the PIN.

export const PIN_PATTERN = /^\d{4}$/;
const SALT_BYTES = 16;

export interface PinHash {
  // Hex strings.
  salt: string;
  hash: string;
}

const toHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string) => Uint8Array.from(hex.match(/../g) ?? [], (pair) => parseInt(pair, 16));

export function isValidPin(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}

// SHA-256 of the salt bytes followed by the PIN's UTF-8 bytes. A new random salt unless one is given.
export async function hashPin(pin: string, salt = toHex(crypto.getRandomValues(new Uint8Array(SALT_BYTES)))): Promise<PinHash> {
  if (!isValidPin(pin)) throw new Error("A PIN is exactly 4 digits.");
  const data = new Uint8Array([...fromHex(salt), ...new TextEncoder().encode(pin)]);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return { salt, hash: toHex(new Uint8Array(digest)) };
}

export async function verifyPin(pin: string, stored: PinHash): Promise<boolean> {
  if (!isValidPin(pin)) return false;
  return (await hashPin(pin, stored.salt)).hash === stored.hash;
}
