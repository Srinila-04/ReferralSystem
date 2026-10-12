import crypto from "crypto";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import ActivityLog from "../models/mongo/ActivityLog.js";
import { Referral, Candidate, Job, User } from "../models/associations.js";
import { sendEmail } from "../services/emailService.js";
import { shortlistedTemplate,rejectedTemplate,} from "../services/emailTemplates.js";
import EmailHistory from "../models/mongo/EmailHistory.js";
import validateEmail from "../utils/validateEmail.js";

const invitationToken = crypto.randomBytes(32).toString("hex");

const invitationExpiresAt = new Date(
  Date.now() + 48 * 60 * 60 * 1000
);


export const createReferral = async (req, res) => {
  const cleanupFile = () => {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Error removing uploaded file:", e.message);
      }
    }
  };

  try {
    const {
      candidateName,
      candidateEmail,
      candidatePhone,
      jobId,
    } = req.body;

    // 1. Mandatory Resume check
    if (!req.file) {
      return res.status(400).json({
        message: "Candidate resume is required (PDF, DOC, or DOCX, max 5 MB).",
      });
    }

    // 2. Validate required fields
    if (!candidateName || !candidateEmail || !jobId) {
      cleanupFile();
      return res.status(400).json({
        message: "Candidate name, email and job are required",
      });
    }

    // 3. Validate and normalize the candidate email
    if (!validateEmail(candidateEmail)) {
      cleanupFile();
      return res.status(400).json({
        message: "Please provide a valid candidate email address.",
      });
    }

    const normalizedEmail = candidateEmail.trim().toLowerCase();

    // 4. Check whether the job exists
    const job = await Job.findByPk(jobId);

    if (!job) {
      cleanupFile();
      return res.status(404).json({
        message: "Job not found",
      });
    }

    // 5. Check whether the job is open
    if (job.status !== "open") {
      cleanupFile();
      return res.status(400).json({
        message: "This job is closed",
      });
    }

    // 6. Find an existing candidate by normalized email
    let candidate = await Candidate.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    // 7. Prevent duplicate referrals for the same job
    if (candidate) {
      const existingReferral = await Referral.findOne({
        where: {
          candidateId: candidate.id,
          jobId: job.id,
        },
      });

      if (existingReferral) {
        cleanupFile();
        return res.status(409).json({
          message: "This candidate has already been referred for this job",
        });
      }
    }

    // 8. Create a candidate or update existing candidate with new resume
    let invitationToken;
    let invitationExpiresAt;

    if (!candidate) {
      invitationToken = crypto.randomBytes(32).toString("hex");

      invitationExpiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      );

      candidate = await Candidate.create({
        name: candidateName.trim(),
        email: normalizedEmail,
        phone: candidatePhone || null,
        resume: req.file.filename,
        invitationToken,
        invitationExpiresAt,
      });
    } else {
      invitationToken = crypto.randomBytes(32).toString("hex");

      invitationExpiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      );

      // Attach new resume to candidate
      await candidate.update({
        resume: req.file.filename,
      });
    }

    // 9. Create the referral for the selected job
    const referral = await Referral.create({
      employeeId: req.user.id,
      candidateId: candidate.id,
      jobId: job.id,
      invitationToken,
      invitationExpiresAt,
    });

    // 9. Return the successful response
    return res.status(201).json({
      message: "Referral created successfully",
      referral,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        emailVerified: candidate.emailVerified,
      },
      invitationToken,
      invitationExpiresAt,
      invitationLink:
        `http://localhost:5173/candidate/accept-invite?token=${invitationToken}`,
    });
  } catch (error) {
    cleanupFile();
    console.error("Create referral error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};



export const validateInvitation = async (req, res) => {
  try {
    // 1. Get the token from the URL query
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        message: "Invitation token is required",
      });
    }

    // 2. Find the referral using the token
    const referral = await Referral.findOne({
      where: { invitationToken: token },
    });

    if (!referral) {
      return res.status(400).json({
        message: "Invalid invitation token",
      });
    }

    // 3. Check whether the invitation has expired
    if (
      !referral.invitationExpiresAt ||
      new Date() > new Date(referral.invitationExpiresAt)
    ) {
      return res.status(410).json({
        message: "Invitation has expired",
      });
    }

    // 4. Find the candidate linked to this referral
    const candidate = await Candidate.findByPk(
      referral.candidateId
    );

    if (!candidate) {
      return res.status(404).json({
        message: "Candidate not found",
      });
    }

    // 5. Return safe candidate details
    return res.status(200).json({
      message: "Invitation is valid",
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
      },
      jobId: referral.jobId,
    });
  } catch (error) {
    console.error("Validate invitation error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


export const acceptInvitation = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Invitation token and password are required",
      });
    }

    // if (password.length < 8) {
    //   return res.status(400).json({
    //     message: "Password must be at least 8 characters",
    //   });
    // }

    const referral = await Referral.findOne({
      where: { invitationToken: token },
    });

    if (!referral) {
      return res.status(400).json({
        message: "Invalid invitation token",
      });
    }

    if (
      !referral.invitationExpiresAt ||
      new Date() > new Date(referral.invitationExpiresAt)
    ) {
      return res.status(410).json({
        message: "Invitation has expired",
      });
    }

    const candidate = await Candidate.findByPk(referral.candidateId);

    if (!candidate) {
      return res.status(404).json({
        message: "Candidate not found",
      });
    }

    if (candidate.userId) {
      return res.status(409).json({
        message: "Candidate account already exists",
      });
    }

    const existingUser = await User.findOne({
      where: { email: candidate.email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: candidate.name,
      email: candidate.email,
      password: hashedPassword,
      role: "candidate",
    });

    await candidate.update({
      userId: user.id,
    });

    await referral.update({
      invitationToken: null,
      invitationExpiresAt: null,
    });

    return res.status(201).json({
      message: "Candidate account created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};


export const getMyReferrals = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({
      where: { userId: req.user.id },
    });

    if (!candidate) {
      return res.status(404).json({
        message: "Candidate profile not found",
      });
    }

    const referrals = await Referral.findAll({
      where: { candidateId: candidate.id },
      include: [
      {
        model: Candidate,
        attributes: ["id", "name", "email", "phone"],
      },
      {
        model: Job,
        attributes: ["id", "title", "department", "location", "status"],
      },
      {
        model: User,
        as: "Employee",
        attributes: ["id", "name", "email"],
      },
     ],
    });

    return res.status(200).json({
      message: "Your referrals fetched successfully",
      referrals,
    });
  } catch (error) {
    console.error("Get my referrals error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};


export const updateReferralStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const allowedStatuses = [
      "referred",
      "under_review",
      "shortlisted",
      "interview",
      "selected",
      "rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid referral status",
      });
    }

    const referral = await Referral.findByPk(id);

    if (!referral) {
      return res.status(404).json({
        message: "Referral not found",
      });
    }

    await referral.update({
      status,
      remarks,
    });

    await ActivityLog.create({
      userId: req.user.id,
      action: "REFERRAL_STATUS_UPDATED",
      details: `Referral status changed to ${status}. Remarks: ${remarks || "None"}`,
      referralId: referral.id,
    });

    return res.status(200).json({
      message: "Referral status updated successfully",
      referral,
    });
  } catch (error) {
    console.error("Update referral status error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};


export const getMySubmissions = async (req, res) => {
  try {
    const referrals = await Referral.findAll({
      where: { employeeId: req.user.id },
      include: [
        {
          model: Candidate,
          attributes: ["id", "name", "email", "phone", "emailVerified"],
        },
        {
          model: Job,
          attributes: ["id", "title", "department", "location", "status"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Your submitted referrals fetched successfully",
      referrals,
    });
  } catch (error) {
    console.error("Get my submissions error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const getAllReferrals = async (req, res) => {
  try {
    const referrals = await Referral.findAll({
      include: [
        {
          model: Candidate,
          attributes: ["id", "name", "email", "phone", "emailVerified", "resume"],
        },
        {
          model: Job,
          attributes: ["id", "title", "department", "location", "status"],
        },
        {
          model: User,
          as: "Employee",
          attributes: ["id", "name", "email"]
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    // Provide safe metadata without exposing server paths or raw bytes in the list payload
    const sanitizedReferrals = referrals.map((ref) => {
      const plain = ref.toJSON();
      if (plain.Candidate) {
        plain.Candidate.hasResume = Boolean(plain.Candidate.resume);
        if (typeof plain.Candidate.resume === "string") {
          plain.Candidate.resumeName = path.basename(plain.Candidate.resume);
        } else if (Buffer.isBuffer(plain.Candidate.resume)) {
          plain.Candidate.resumeName = "resume.pdf";
        }
        delete plain.Candidate.resume;
      }
      return plain;
    });

    return res.status(200).json({
      message: "All referrals fetched successfully",
      referrals: sanitizedReferrals,
    });
  } catch (error) {
    console.error("Get all referrals error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const getReferralResume = async (req, res) => {
  try {
    const { id } = req.params;

    const referral = await Referral.findByPk(id, {
      include: [
        {
          model: Candidate,
          attributes: ["id", "name", "email", "resume"],
        },
      ],
    });

    if (!referral) {
      return res.status(404).json({
        message: "Referral not found",
      });
    }

    if (!referral.Candidate || !referral.Candidate.resume) {
      return res.status(404).json({
        message: "No resume found for this candidate",
      });
    }

    const resumeData = referral.Candidate.resume;

    // Case 1: Stored as file on disk (uploads/resumes/...)
    let filename = null;
    if (typeof resumeData === "string") {
      filename = resumeData;
    } else if (Buffer.isBuffer(resumeData) && !resumeData.subarray(0, 5).toString().startsWith("%PDF-")) {
      filename = resumeData.toString("utf8");
    }

    if (filename) {
      const safeBasename = path.basename(filename);
      const filePath = path.join(process.cwd(), "uploads", "resumes", safeBasename);

      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        let contentType = "application/octet-stream";
        if (ext === ".pdf") contentType = "application/pdf";
        else if (ext === ".docx") contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        else if (ext === ".doc") contentType = "application/msword";

        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `inline; filename="${safeBasename}"`);
        res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
        res.setHeader("X-Content-Type-Options", "nosniff");

        return fs.createReadStream(filePath).pipe(res);
      }
    }

    // Case 2: Buffer stored directly in database (e.g. legacy/seed records)
    if (Buffer.isBuffer(resumeData)) {
      const isPdf = resumeData.subarray(0, 5).toString().startsWith("%PDF-");
      const contentType = isPdf ? "application/pdf" : "application/octet-stream";
      const defaultName = isPdf ? "resume.pdf" : "resume.bin";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `inline; filename="${defaultName}"`);
      res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
      res.setHeader("X-Content-Type-Options", "nosniff");

      return res.send(resumeData);
    }

    return res.status(404).json({
      message: "Resume file could not be located on server",
    });
  } catch (error) {
    console.error("Get referral resume error:", error);
    return res.status(500).json({
      message: "Unable to retrieve candidate resume",
    });
  }
};


export const sendReferralEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason = "" } = req.body;

    // 1. Validate the requested action
    if (!["preview", "send"].includes(action)) {
      return res.status(400).json({
        message: 'Action must be "preview" or "send"',
      });
    }

    // 2. Find the referral with candidate and job details
    const referral = await Referral.findByPk(id, {
      include: [
        {
          model: Candidate,
          attributes: ["id", "name", "email", "emailVerified"],
        },
        {
          model: Job,
          attributes: ["id", "title"],
        },
      ],
    });

    if (!referral) {
      return res.status(404).json({
        message: "Referral not found",
      });
    }

    if (!referral.Candidate || !referral.Job) {
      return res.status(404).json({
        message: "Candidate or job details not found",
      });
    }

    // 3. Allow emails only for shortlisted or rejected referrals
    let email;

    if (referral.status === "shortlisted") {
      email = shortlistedTemplate({
        candidateName: referral.Candidate.name,
        jobTitle: referral.Job.title,
      });
    } else if (referral.status === "rejected") {
      email = rejectedTemplate({
        candidateName: referral.Candidate.name,
        jobTitle: referral.Job.title,
        reason,
      });
    } else {
      return res.status(400).json({
        message:
          "Email is available only for shortlisted or rejected referrals",
      });
    }

    // 4. Return the email preview without sending anything
    if (action === "preview") {
      return res.status(200).json({
        message: "Email preview generated successfully",
        recipient: referral.Candidate.email,
        templateType: referral.status,
        subject: email.subject,
        html: email.html,
      });
    }

    // 5. Validate the recipient before attempting to send
    if (!referral.Candidate.email) {
      return res.status(400).json({
        message: "Candidate email address is missing.",
      });
    }

    // 6. Require email verification before sending a decision email
    if (!referral.Candidate.emailVerified) {
      return res.status(409).json({
        message:
          "This candidate's email address has not been verified. Please ask the referring employee to verify or correct the email address before sending this email.",
        emailVerified: false,
      });
    }

    // 7. Send the email and capture any sending error
    let emailStatus = "success";
    let errorMessage = "";

    try {
      await sendEmail({
        to: referral.Candidate.email,
        subject: email.subject,
        html: email.html,
      });
    } catch (error) {
      emailStatus = "failed";
      errorMessage = error.message;

      console.error("Email sending failed:", error.message);
    }

    // 8. Save the email attempt in MongoDB
    try {
      await EmailHistory.create({
        referralId: referral.id,
        userId: req.user.id,
        recipient: referral.Candidate.email,
        templateType: referral.status,
        status: emailStatus,
        errorMessage,
      });
    } catch (historyError) {
      console.error(
        "Email history recording failed:",
        historyError.message
      );

      // Do not report successful history recording if it failed.
      return res.status(500).json({
        message: "Email attempt processed, but history recording failed",
        emailStatus,
      });
    }

    // 9. Return an error if the email failed
    if (emailStatus === "failed") {
      return res.status(502).json({
        message: "Email sending failed",
      });
    }

    // 10. Record the successful send in the activity log
    try {
      await ActivityLog.create({
        userId: req.user.id,
        action: "REFERRAL_EMAIL_SENT",
        details: `Email sent to ${referral.Candidate.email} using the ${referral.status} template`,
        referralId: referral.id,
      });
    } catch (logError) {
      console.error("Activity log recording failed:", logError.message);
    }

    // 11. Return the success response
    return res.status(200).json({
      message: "Email sent successfully",
      recipient: referral.Candidate.email,
      templateType: referral.status,
    });
  } catch (error) {
    console.error("Send referral email error:", error.message);

    return res.status(500).json({
      message: "Unable to process referral email",
    });
  }
};


