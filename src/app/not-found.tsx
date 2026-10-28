import type { Metadata } from "next";
import { BackToTodayState } from "@/components/shell/BackToTodayState";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return <BackToTodayState kind="not-found" />;
}
