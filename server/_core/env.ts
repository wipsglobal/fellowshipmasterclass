import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local FIRST before exporting ENV
config({ path: resolve(process.cwd(), ".env.local") });

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

// Debug logging for Paystack configuration
console.log("[ENV] Paystack configuration loaded:", {
  hasPublicKey: !!ENV.paystackPublicKey,
  hasSecretKey: !!ENV.paystackSecretKey,
  publicKeyPrefix: ENV.paystackPublicKey ? ENV.paystackPublicKey.substring(0, 8) + "..." : "NOT SET",
  secretKeyPrefix: ENV.paystackSecretKey ? ENV.paystackSecretKey.substring(0, 8) + "..." : "NOT SET",
});