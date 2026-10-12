import express from "express";
import { getHRDashboard } from "../controllers/hrController.js";
import authenticate from "../middleware/authMiddleware.js";
import authorizeRole from "../middleware/roleMiddleware.js";

const router = express.Router();

// GET /api/hr/dashboard - Protected: HR and Admin roles
router.get("/dashboard", authenticate, authorizeRole("hr", "admin"), getHRDashboard);

export default router;

