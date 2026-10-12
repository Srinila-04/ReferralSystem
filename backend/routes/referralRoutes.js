import express from "express";
import { createReferral,validateInvitation,acceptInvitation,getMyReferrals,updateReferralStatus,getMySubmissions,getAllReferrals,sendReferralEmail,getReferralResume } from "../controllers/referralController.js";
import authenticate from "../middleware/authMiddleware.js";
import authorizeRole from "../middleware/roleMiddleware.js";
import { handleResumeUpload } from "../middleware/uploadResume.js";
import { sendVerificationEmail,verifyCandidateEmail} from "../controllers/emailVerificationController.js";

const router = express.Router();

router.post("/", authenticate, authorizeRole("employee"), handleResumeUpload, createReferral);
router.get("/accept-invite", validateInvitation);
router.post("/accept-invite", acceptInvitation);
router.get("/my-referrals", authenticate, authorizeRole("candidate"),getMyReferrals);
router.patch("/:id/status",authenticate,authorizeRole("admin","hr"),updateReferralStatus);
router.get("/my-submissions",authenticate,authorizeRole("employee"), getMySubmissions);
router.get("/", authenticate,authorizeRole("admin","hr"),getAllReferrals);
router.get("/:id/resume", authenticate, authorizeRole("admin", "hr"), getReferralResume);
router.post("/:id/send-email",authenticate, authorizeRole("admin", "hr"),
sendReferralEmail);
router.post("/:candidateId/send-verification",authenticate, authorizeRole("admin","hr"), sendVerificationEmail),
router.get("/verify-email", verifyCandidateEmail)

export default router;