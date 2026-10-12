import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { User, Profile } from "../models/associations.js";

/**
 * GET /api/profile
 * Get current authenticated user's own profile and associated profile fields.
 * Restricted to authenticated user (all roles).
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "role", "status", "createdAt", "updatedAt"],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const [profile] = await Profile.findOrCreate({
      where: { userId: user.id },
      defaults: {
        userId: user.id,
        phone: null,
        department: null,
        designation: null,
        avatar: null,
      },
    });

    return res.status(200).json({
      success: true,
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || "active",
        phone: profile.phone || "",
        department: profile.department || "",
        designation: profile.designation || "",
        avatar: profile.avatar || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve profile details.",
    });
  }
};

/**
 * PUT /api/profile
 * Update current authenticated user's own profile fields.
 * Protected fields (role, status, password, id) cannot be modified here.
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, department, designation } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // Check email uniqueness if email is changed
    const trimmedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({
      where: {
        email: trimmedEmail,
        id: { [Op.ne]: req.user.id },
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email address is already in use by another account.",
      });
    }

    // Update User record (only name and email permitted)
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    await user.update({
      name: name.trim(),
      email: trimmedEmail,
    });

    // Update or create Profile record
    const [profile] = await Profile.findOrCreate({
      where: { userId: user.id },
      defaults: { userId: user.id },
    });

    await profile.update({
      phone: phone !== undefined ? (phone ? phone.trim() : null) : profile.phone,
      department: department !== undefined ? (department ? department.trim() : null) : profile.department,
      designation: designation !== undefined ? (designation ? designation.trim() : null) : profile.designation,
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || "active",
        phone: profile.phone || "",
        department: profile.department || "",
        designation: profile.designation || "",
        avatar: profile.avatar || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  }
};

/**
 * POST /api/profile/avatar
 * Upload cropped profile picture for the authenticated user.
 */
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please choose an image file to upload.",
      });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const [profile] = await Profile.findOrCreate({
      where: { userId: req.user.id },
      defaults: { userId: req.user.id },
    });

    await profile.update({
      avatar: avatarUrl,
    });

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully.",
      avatarUrl,
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save profile picture.",
    });
  }
};

/**
 * PUT /api/profile/password
 * Securely change the current authenticated user's password.
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password, new password, and confirmation are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters in length.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation password do not match.",
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change password.",
    });
  }
};

