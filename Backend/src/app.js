import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "node:dns";
import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

// Set DNS servers to avoid Windows SRV lookup failures
try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
    console.warn("DNS server override not available:", e.message);
}

const app = express();
const server = createServer(app);

// Connect Socket.io
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);

// Apply CORS middleware
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

// Serve frontend static files if built
if (fs.existsSync(frontendDistPath)) {
    console.log(`Serving frontend static files from: ${frontendDistPath}`);
    app.use(express.static(frontendDistPath));
    app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api/")) {
            return next();
        }
        res.sendFile(path.join(frontendDistPath, "index.html"));
    });
} else {
    // Root health check endpoint when frontend is not bundled
    app.get("/", (req, res) => {
        res.json({ status: "ok", message: "NEXAMEET API is running" });
    });
}

// MongoDB Connection with Smart Fallback & Non-blocking Startup
const start = async () => {
    const port = app.get("port");
    
    server.listen(port, () => {
        console.log(`🚀 NEXAMEET Server listening on port ${port}`);
    });

    const primaryUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nexameet";
    const localUri = "mongodb://127.0.0.1:27017/nexameet";

    try {
        console.log(`Connecting to MongoDB...`);
        const connectionDb = await mongoose.connect(primaryUri);
        console.log(`✅ MongoDB Connected: ${connectionDb.connection.host}`);
    } catch (primaryError) {
        console.warn(`Primary MongoDB connection failed (${primaryError.message}). Attempting local fallback...`);
        try {
            const fallbackDb = await mongoose.connect(localUri);
            console.log(`✅ Fallback MongoDB Connected: ${fallbackDb.connection.host}`);
        } catch (fallbackError) {
            console.error("⚠️ Warning: Could not connect to MongoDB database.");
            console.error("Video calls will continue to function, but Auth and History require a MongoDB database.");
            console.error("Provide a valid MONGO_URI in .env or start your local MongoDB service.");
        }
    }
};

start();


