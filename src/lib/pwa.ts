export const IOS_INSTALL_HINT = "Tap Share, then Add to Home Screen.";

// iPhone, iPod or iPad (iPadOS reports itself as a Mac with touch), not already opened from the home screen.
// iOS has no install prompt, so these users get a one-line hint instead.
export function needsIosInstallHint(userAgent: string, maxTouchPoints: number, standalone: boolean): boolean {
  if (standalone) return false;
  const iPhoneOrIPad = /iPhone|iPad|iPod/.test(userAgent);
  const iPadOs = /Macintosh/.test(userAgent) && maxTouchPoints > 1;
  return iPhoneOrIPad || iPadOs;
}
