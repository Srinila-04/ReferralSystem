import express from "express";
import {
  getAdminDashboard,
  getEmployees,
  getHRDirectory,
  getCandidateDirectory,
  getAdminJobs,
  toggleJobStatus,
  getAdminReferrals,
  getActivityLogs,
  getEmailHistory,
} from "../controllers/adminController.js";
import authenticate from "../middleware/authMiddleware.js";
import authorizeRole from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes are strictly protected and require the Admin role
router.use(authenticate, authorizeRole("admin"));

// Dashboard metrics & overview
router.get("/dashboard", getAdminDashboard);

// User Management directories
router.get("/employees", getEmployees);
router.get("/hr", getHRDirectory);
router.get("/candidates", getCandidateDirectory);

// Job Management (system-wide oversight)
router.get("/jobs", getAdminJobs);
router.patch("/jobs/:id/status", toggleJobStatus);

// Referral Management (system-wide oversight)
router.get("/referrals", getAdminReferrals);

// Audit & History logs (MongoDB)
router.get("/activity-logs", getActivityLogs);
router.get("/email-history", getEmailHistory);

export default router;
