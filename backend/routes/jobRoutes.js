import express from "express";
import { createJob,getJobs,getJobById,updateJob,closeJob } from "../controllers/jobController.js";
import authenticate from "../middleware/authMiddleware.js";
import authorizeRole from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", authenticate, authorizeRole("admin","hr"), createJob );
router.get("/", authenticate, authorizeRole("admin","hr","employee"), getJobs);
router.get("/:id", authenticate, authorizeRole("admin", "hr", "employee"), getJobById);
router.put("/:id", authenticate,authorizeRole("admin","hr"), updateJob);
router.patch("/:id/status", authenticate,authorizeRole("admin","hr"), closeJob);

export default router;