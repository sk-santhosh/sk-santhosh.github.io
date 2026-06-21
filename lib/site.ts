// Absolute site origin used for metadata, canonical URLs, sitemap and robots.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  `https://sk-santhosh.info${process.env.NEXT_PUBLIC_BASE_PATH || ""}`;

// Google Search Console verification token.
// Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION in the environment (or GitHub Actions
// secret) to the value Google gives you under "HTML tag" verification.
export const googleSiteVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
