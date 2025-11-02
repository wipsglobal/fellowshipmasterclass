import { resolve } from "path";
import { config } from "dotenv";

// Only load local .env file when not in production. In production the host
// (e.g., Vercel) should provide environment variables and we must avoid
// accidentally loading developer .env files.
if (process.env.NODE_ENV !== "production") {
  // Load local env for development only. In production, use platform envs.
  try {
    config({ path: resolve(process.cwd(), ".env.local") });
  } catch (err) {
    // ignore if dotenv not available or .env.local missing
  }
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY ?? "",
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY ?? "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: process.env.SMTP_PORT ?? "587",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPassword: process.env.SMTP_PASSWORD ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "fellowshipmastercertificates@ibakmglobal.com",
};

// In non-production environments we log whether payment keys are present so
// developers can notice a missing configuration. Never print key material or
// prefixes in logs.
if (!ENV.isProduction) {
  console.log("[ENV] Paystack configuration loaded:", {
    hasPublicKey: !!ENV.paystackPublicKey,
    hasSecretKey: !!ENV.paystackSecretKey,
  });
}