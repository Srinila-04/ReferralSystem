import crypto from "crypto";
import { Op } from "sequelize";
import Candidate from "../models/Candidate.js";
import EmailVerification from "../models/EmailVerification.js";
import { sendEmail } from "../services/emailService.js";
import validateEmail from "../utils/validateEmail.js";

export const sendVerificationEmail = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const candidate = await Candidate.findByPk(candidateId);

    if (!candidate) {
      return res.status(404).json({
        message: "Candidate not found",
      });
    }

    if (!validateEmail(candidate.email)) {
      return res.status(400).json({
        message:
          "The candidate's email address appears invalid. Please ask the referring employee to correct it.",
      });
    }

    if (candidate.emailVerified) {
      return res.status(400).json({
        message: "Candidate email is already verified",
      });
    }

    // Generate a secure, random token
    const token = crypto.randomBytes(32).toString("hex");

    // Token expires after 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Replace any previous verification request for this candidate
    await EmailVerification.destroy({
      where: { candidateId: candidate.id },
    });

    await EmailVerification.create({
      candidateId: candidate.id,
      token,
      expiresAt,
    });

    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationLink = `${frontendBaseUrl}/verify-email?token=${token}`;

    await sendEmail({
      to: candidate.email,
      subject: "Verify your email address",
      html: `
        <p>Hello ${candidate.name},</p>
        <p>Please click the link below to verify your email address.</p>
        <p><a href="${verificationLink}">Verify Email</a></p>
        <p>This link expires in 30 minutes.</p>
      `,
    });

    return res.status(200).json({
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Send verification email error:", error.message);

    return res.status(500).json({
      message: "Unable to send verification email",
    });
  }
};

export const verifyCandidateEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        message: "Verification token is required",
      });
    }

    const verification = await EmailVerification.findOne({
      where: {
        token,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!verification) {
      return res.status(400).json({
        message: "Verification link is invalid or expired",
      });
    }

    const candidate = await Candidate.findByPk(
      verification.candidateId
    );

    if (!candidate) {
      return res.status(404).json({
        message: "Candidate not found",
      });
    }

    if (candidate.emailVerified) {
      await verification.destroy();
      return res.status(200).json({
        message: "Email is already verified",
        alreadyVerified: true,
      });
    }

    await candidate.update({ emailVerified: true });

    await verification.destroy();

    return res.status(200).json({
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify candidate email error:", error.message);

    return res.status(500).json({
      message: "Unable to verify email",
    });
  }
};
