import type { Metadata } from "next";
import { HomeRedirect } from "@/components/shell/HomeRedirect";

// A landing route: the only app URL crawlers may index, with Privacy and Terms.
export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function Home() {
  return <HomeRedirect />;
}
