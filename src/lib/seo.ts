/** Site-wide SEO facts that are already present in the public site copy. */
export const SITE_NAME = "MRD Mahal";
export const SITE_DESCRIPTION =
  "MRD Mahal — Your Dream Moments in Our Grand venues.";

/** Set VITE_SITE_URL to the production origin (for example, https://example.com). */
export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || "https://mrdmahal.com")
  ?.trim()
  .replace(/\/+$/, "");

export function canonicalUrl(path: string): string | undefined {
  if (!SITE_URL) return undefined;
  return new URL(path, `${SITE_URL}/`).toString();
}
