import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { Server } from "socket.io";
import setupSocket from "./utils/socket.js";
import connectDB from "./config/db.js";
import { validateEnv } from "./config/env.js";
import { sanitizeBody } from "./middleware/sanitize.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimiters.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import safetyRoutes from "./routes/safetyRoutes.js";
import referralRoutes from "./routes/referralRoutes.js";
import premiumRoutes from "./routes/premiumRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();
validateEnv();
connectDB();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

// Security & performance middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // Default img-src ('self' data:) blocks every user photo — they're
        // all hosted on Cloudinary (see config/cloudinary.js), not served
        // from this origin. Scoped to that one host rather than loosening
        // to a blanket `https:`.
        "img-src": ["'self'", "data:", "https://res.cloudinary.com"],
      },
    },
  }),
);
app.use(compression());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "512kb" }));
app.use(sanitizeBody);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);

// Static admin panel (plain HTML/CSS/JS — no build step, see public/admin/)
app.use("/admin", express.static(path.join(__dirname, "public/admin")));

//HTTP server + socket.io
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.set("io", io);
setupSocket(io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/safety", safetyRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

app.get("/health", (req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  const dbState = mongoose.connection.readyState;
  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? "ok" : "degraded",
    db: states[dbState] || "unknown",
    uptime: process.uptime(),
  });
});

// Without this, Express's default handler renders an HTML page for uncaught
// errors (e.g. from multer/Cloudinary middleware that runs before a route's
// own try/catch), which breaks clients expecting JSON.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

function gracefulShutdown(signal) {
  console.log(`${signal} received: shutting down gracefully`);
  server.close(async () => {
    await mongoose.connection.close();
    console.log("HTTP server and MongoDB connection closed.");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Forced shutdown after 10s timeout");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
