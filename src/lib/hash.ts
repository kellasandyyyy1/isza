// FNV-1a: the same text always gives the same number. Shared by the daily meal and the daily card notes,
// so a day's picks survive a reload without Math.random.
export function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
