"use client";

import { Plus_Jakarta_Sans } from "next/font/google";
import { BackToTodayState } from "@/components/shell/BackToTodayState";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

// Catches any error the app does not handle. It replaces the root layout, so it brings its own html, body and
// font. Light or dark follows the system setting here.
export default function GlobalError() {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-bg text-ink">
        <title>Something went wrong | Iszacycle</title>
        <BackToTodayState kind="error" />
      </body>
    </html>
  );
}
