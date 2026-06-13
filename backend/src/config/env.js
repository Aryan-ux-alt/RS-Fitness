import "dotenv/config";

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "dev-access-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM || "+14155238886",
  adminWhatsappNumber: process.env.ADMIN_WHATSAPP_NUMBER || "+919023987904",
  callmebotApiKey: process.env.CALLMEBOT_API_KEY,
};

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is required");
}
