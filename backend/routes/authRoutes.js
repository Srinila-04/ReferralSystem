import express from "express";
import { register,login,refreshAccessToken,logout } from "../controllers/authController.js";
import authenticate from "../middleware/authMiddleware.js";
import authorizeRole from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, (req,res) => {
    res.json({
        message: "You are autheticated",
        user: req.user,
    });
});

router.get("/employee-test", authenticate, authorizeRole("employee"), ( req, res) => {
    res.json({ message:"Employee access granted"})
});
router.get("/hr-test", authenticate, authorizeRole("hr"), (req, res) => {
    res.json({ message: "HR access granted",})
});
router.post("/refresh", refreshAccessToken)
router.post("/logout",logout);

export default router;