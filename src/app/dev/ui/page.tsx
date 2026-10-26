import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UiShowcase } from "@/dev/ui/UiShowcase";

export const metadata: Metadata = {
  title: "UI kit",
};

// Development only: production builds return 404.
export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <UiShowcase />;
}
