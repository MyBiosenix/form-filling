const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const splitOrigins = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 1212,
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  corsOrigins: splitOrigins(process.env.CORS_ORIGIN),
  superAdminName: process.env.SUPERADMIN_NAME || "",
  superAdminEmail: process.env.SUPERADMIN_EMAIL || "",
  superAdminPassword: process.env.SUPERADMIN_PASSWORD || "",
};

module.exports = env;
