import express from "express";
import "dotenv/config";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js"
import connectDB from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3000;

// 🚧 Increase payload limit to avoid PayloadTooLargeError
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors());

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    connectDB();
});
