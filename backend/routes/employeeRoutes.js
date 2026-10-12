import express from "express";
import { getEmployeeDashboard } from "../controllers/employeeController.js";
import authenticate from "../middleware/authMiddleware.js";
import authorizeRole from "../middleware/roleMiddleware.js";

const router = express.Router();

// GET /api/employee/dashboard - Strictly authenticated for Employee role
router.get("/dashboard", authenticate, authorizeRole("employee"), getEmployeeDashboard);

export default router;

