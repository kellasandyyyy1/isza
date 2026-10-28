import type { MetadataRoute } from "next";

// Crawlers may read the landing routes only: the start page, Privacy and Terms. Everything else is the app itself.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/$", "/privacy", "/terms"], disallow: "/" },
  };
}
