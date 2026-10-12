import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

const uploadDir = path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = req.user?.id || "guest";
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    cb(null, `avatar-${userId}-${uniqueSuffix}${ext}`);
  },
});

const uploadAvatar = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return cb(new Error("Only JPG, JPEG, PNG, and WEBP image formats are supported for profile pictures"));
    }

    cb(null, true);
  },
});

export const handleAvatarUpload = (req, res, next) => {
  uploadAvatar.single("avatar")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "Profile picture size exceeds the 5 MB limit. Please upload a smaller image.",
        });
      }
      return res.status(400).json({
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        message: err.message || "Invalid profile picture upload.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "No image file provided. Please choose a profile picture to upload.",
      });
    }

    next();
  });
};

export default handleAvatarUpload;

