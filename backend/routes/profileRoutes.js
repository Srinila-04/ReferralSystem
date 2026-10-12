import express from "express";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
} from "../controllers/profileController.js";
import authenticate from "../middleware/authMiddleware.js";
import { handleAvatarUpload } from "../middleware/uploadAvatar.js";

const router = express.Router();

// All routes are strictly protected by JWT authentication
router.get("/", authenticate, getProfile);
router.put("/", authenticate, updateProfile);
router.post("/avatar", authenticate, handleAvatarUpload, uploadAvatar);
router.put("/password", authenticate, changePassword);

export default router;

