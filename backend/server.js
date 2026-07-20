import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import {Server} from "socket.io";
import setupSocket from "./utils/socket.js";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from './routes/profileRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import matchRoutes from "./routes/matchRoutes.js"
dotenv.config();
connectDB();

const app = express();

// Middlewares
app.use(cors({
    origin:"*",
    methods:['GET','POST','PUT','DELETE'],
    credentials:true
}));
app.use(express.json());

//HTTP server + socket.io
const server = http.createServer(app);
const io = new Server(server,{cores:{origin:"*"}});
//setup socket logic
setupSocket(io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile",profileRoutes);
app.use("/api/chats",chatRoutes);
app.use("/api/match",matchRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
