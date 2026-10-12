import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
// import rateLimit from "express-rate-limit";
import sequelize from "./config/database.js";
import mongoConnect from "./config/mongoConnect.js";
import User from "./models/User.js";
import Profile from "./models/Profile.js";
import Job from "./models/Job.js";
import Candidate from "./models/Candidate.js";
import Referral from "./models/Referral.js";
import RefreshToken from "./models/RefreshToken.js";
import "./models/associations.js";
import EmailVerification from "./models/EmailVerification.js";
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import referralRoutes from "./routes/referralRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import hrRoutes from "./routes/hrRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import path from "path";


dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173"
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Serve uploaded assets (avatars, etc.) statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
// });

// app.use(limiter);

app.get("/", (req, res) => {
  res.json({
    message: "Referral Management Backend is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/employee", employeeRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL connected successfully");

    await sequelize.sync();
    console.log("Database tables synced successfully");

    await mongoConnect();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
  }
};

startServer();