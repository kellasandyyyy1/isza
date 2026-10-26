import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AppLockProvider } from "@/components/lock/AppLockProvider";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Isza", template: "%s | Isza" },
  description: "Sync your training, food and rest with your cycle.",
};

// "cover" lets env(safe-area-inset-*) report real values on notched phones.
export const viewport: Viewport = {
  viewportFit: "cover",
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
