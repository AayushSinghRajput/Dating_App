import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import setupSocket from "./utils/socket.js";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
dotenv.config();
connectDB();

const app = express();

// Middlewares
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

//HTTP server + socket.io
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.set("io", io);
//setup socket logic
setupSocket(io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
