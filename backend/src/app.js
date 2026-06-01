const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const adminRoutes = require("./routes/AdminRoutes");
const healthRoutes = require("./routes/healthRoutes");
const userRoutes = require("./routes/UserRoutes");
const subAdminRoutes = require("./routes/subadminRoutes");

const app = express();

const corsOptions = {
  origin(origin, callback) {
    if (!origin || env.corsOrigins.length === 0 || env.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS origin not allowed"));
  },
  credentials: true,
};

app.locals.env = env;
app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/sub-admin", subAdminRoutes);

module.exports = app;
