
import jwt from "jsonwebtoken";
import { User } from "../models/associations.js";

const authenticate = async (req, res, next) => {
  try {
    const authHeader =
      req.headers.authorization || req.headers.Authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization token required",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Invalid authorization format",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get the user's current account status from MySQL
    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "name", "email", "role", "status"],
    });

    if (!user) {
      return res.status(401).json({
        message: "User account not found",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: `Your account is ${user.status}. Please contact the administrator.`,
      });
    }

    // Use current database details rather than trusting stale JWT role data
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    console.error("Authentication error:", error);

    return res.status(500).json({
      message: "Authentication failed",
    });
  }
};

export default authenticate;
