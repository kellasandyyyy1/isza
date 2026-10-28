import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AppLockProvider } from "@/components/lock/AppLockProvider";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { themeInitScript } from "@/lib/theme";
import { COLOR_TOKENS } from "@/lib/tokens";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const description = "Sync your training, food and rest with your cycle. Your data stays on this device.";

export const metadata: Metadata = {
  // Absolute URLs for the Open Graph image: the production domain on Vercel, localhost otherwise.
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
  title: { default: "Iszacycle", template: "%s | Iszacycle" },
  description,
  applicationName: "Iszacycle",
  // The image comes from src/app/opengraph-image.png, a placeholder for now.
  openGraph: { type: "website", siteName: "Iszacycle", title: "Iszacycle", description },
  // Only the landing routes may be indexed; see robots.ts. The app screens hold nothing worth a search result.
  robots: { index: false, follow: false },
};

// "cover" lets env(safe-area-inset-*) report real values on notched phones.
// The browser bar matches the page background in each theme.
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: COLOR_TOKENS.light.bg },
    { media: "(prefers-color-scheme: dark)", color: COLOR_TOKENS.dark.bg },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plusJakartaSans.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-bg text-ink">
        <PwaProvider>
          <ThemeProvider>
            <AppLockProvider>{children}</AppLockProvider>
          </ThemeProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
