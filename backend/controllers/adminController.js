import { Op } from "sequelize";
import mongoose from "mongoose";
import path from "path";
import sequelize from "../config/database.js";
import { User, Profile, Job, Referral, Candidate } from "../models/associations.js";
import ActivityLog from "../models/mongo/ActivityLog.js";
import EmailHistory from "../models/mongo/EmailHistory.js";

/**
 * GET /api/admin/dashboard
 * Aggregates organization-wide recruitment, user distribution,
 * system overview metrics, recent activity from MongoDB, and recent records.
 * Protected: Admin role only.
 */
export const getAdminDashboard = async (req, res) => {
  try {
    // 1. Parallel aggregate queries for metrics
    const [
      totalUsers,
      totalEmployees,
      totalHR,
      totalCandidates,
      totalJobs,
      openJobs,
      closedJobs,
      totalReferrals,
      referredCount,
      underReviewCount,
      shortlistedCount,
      interviewCount,
      selectedCount,
      rejectedCount,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { role: "employee" } }),
      User.count({ where: { role: "hr" } }),
      Candidate.count(),
      Job.count(),
      Job.count({ where: { status: "open" } }),
      Job.count({ where: { status: "closed" } }),
      Referral.count(),
      Referral.count({ where: { status: "referred" } }),
      Referral.count({ where: { status: "under_review" } }),
      Referral.count({ where: { status: "shortlisted" } }),
      Referral.count({ where: { status: "interview" } }),
      Referral.count({ where: { status: "selected" } }),
      Referral.count({ where: { status: "rejected" } }),
    ]);

    const pendingReferrals = referredCount + underReviewCount;

    // 2. User distribution by role
    const candidateUsersCount = await User.count({ where: { role: "candidate" } });
    const adminCount = await User.count({ where: { role: "admin" } });

    const userDistribution = [
      {
        role: "employee",
        label: "Employees",
        count: totalEmployees,
        percentage: totalUsers > 0 ? Math.round((totalEmployees / totalUsers) * 100) : 0,
        color: "bg-blue-600",
      },
      {
        role: "hr",
        label: "HR Specialists",
        count: totalHR,
        percentage: totalUsers > 0 ? Math.round((totalHR / totalUsers) * 100) : 0,
        color: "bg-indigo-600",
      },
      {
        role: "candidate",
        label: "Candidate Users",
        count: candidateUsersCount,
        percentage: totalUsers > 0 ? Math.round((candidateUsersCount / totalUsers) * 100) : 0,
        color: "bg-amber-500",
      },
      {
        role: "admin",
        label: "Administrators",
        count: adminCount,
        percentage: totalUsers > 0 ? Math.round((adminCount / totalUsers) * 100) : 0,
        color: "bg-emerald-600",
      },
    ];

    // 3. Recruitment pipeline breakdown
    const recruitmentOverview = {
      jobs: {
        total: totalJobs,
        open: openJobs,
        closed: closedJobs,
        openPercentage: totalJobs > 0 ? Math.round((openJobs / totalJobs) * 100) : 0,
      },
      referrals: [
        { status: "referred", label: "Submitted", count: referredCount, color: "bg-blue-500" },
        { status: "under_review", label: "Under Review", count: underReviewCount, color: "bg-amber-500" },
        { status: "shortlisted", label: "Shortlisted", count: shortlistedCount, color: "bg-indigo-500" },
        { status: "interview", label: "Interview", count: interviewCount, color: "bg-purple-500" },
        { status: "selected", label: "Selected / Hired", count: selectedCount, color: "bg-emerald-500" },
        { status: "rejected", label: "Rejected", count: rejectedCount, color: "bg-rose-500" },
      ],
    };

    // 4. Recent jobs (latest 5 with referral counts)
    const recentJobsRaw = await Job.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "title", "department", "location", "status", "createdAt"],
    });

    const jobIds = recentJobsRaw.map((j) => j.id);
    let jobReferralCounts = {};
    if (jobIds.length > 0) {
      const counts = await Referral.findAll({
        where: { jobId: { [Op.in]: jobIds } },
        attributes: ["jobId", [sequelize.fn("COUNT", sequelize.col("id")), "referralCount"]],
        group: ["jobId"],
        raw: true,
      });
      counts.forEach((c) => {
        jobReferralCounts[c.jobId] = parseInt(c.referralCount, 10);
      });
    }

    const recentJobs = recentJobsRaw.map((job) => {
      const plain = job.toJSON();
      plain.referralCount = jobReferralCounts[plain.id] || 0;
      return plain;
    });

    // 5. Recent referrals (latest 5)
    const recentReferrals = await Referral.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Candidate,
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: Job,
          attributes: ["id", "title", "department"],
        },
        {
          model: User,
          as: "Employee",
          attributes: ["id", "name", "email"],
        },
      ],
      attributes: ["id", "status", "createdAt"],
    });

    // 6. Recent activity from MongoDB ActivityLog
    let recentActivity = [];
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const rawLogs = await ActivityLog.find()
          .sort({ createdAt: -1 })
          .limit(6)
          .lean();

        // Resolve user IDs to actual User records
        const userIds = [...new Set(rawLogs.map((l) => l.userId).filter(Boolean))];
        let usersMap = {};
        if (userIds.length > 0) {
          const users = await User.findAll({
            where: { id: { [Op.in]: userIds } },
            attributes: ["id", "name", "email", "role"],
            raw: true,
          });
          users.forEach((u) => {
            usersMap[u.id] = u;
          });
        }

        recentActivity = rawLogs.map((log) => ({
          ...log,
          actor: usersMap[log.userId] || { id: log.userId, name: `User #${log.userId}`, role: "user" },
        }));
      } catch (mongoErr) {
        console.warn("MongoDB ActivityLog fetch warning:", mongoErr.message);
        recentActivity = [];
      }
    }

    return res.status(200).json({
      success: true,
      message: "Admin dashboard metrics retrieved successfully",
      data: {
        metrics: {
          totalUsers,
          totalEmployees,
          totalHR,
          totalCandidates,
          totalJobs,
          openJobs,
          closedJobs,
          totalReferrals,
          pendingReferrals,
        },
        userDistribution,
        recruitmentOverview,
        recentJobs,
        recentReferrals,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Get admin dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve admin dashboard metrics.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * GET /api/admin/employees
 * Retrieve paginated employee records with search and filtering.
 */
export const getEmployees = async (req, res) => {
  try {
    const { search, department, role, status } = req.query;

    let roleCondition = "employee";
    if (role) {
      const normalizedRole = role.toLowerCase().trim();
      if (normalizedRole === "all") {
        roleCondition = { [Op.in]: ["employee", "hr", "admin"] };
      } else if (["employee", "hr", "admin", "candidate"].includes(normalizedRole)) {
        roleCondition = normalizedRole;
      }
    }

    const where = {
      role: roleCondition,
    };

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: searchTerm } },
        { email: { [Op.like]: searchTerm } },
      ];
    }

    if (status && ["active", "inactive", "suspended"].includes(status.toLowerCase().trim())) {
      where.status = status.toLowerCase().trim();
    }

    const profileWhere = {};
    if (department && department.trim() && department.toLowerCase().trim() !== "all") {
      profileWhere.department = {
        [Op.like]: `%${department.trim()}%`,
      };
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = req.query.limit && req.query.limit.toLowerCase() === "all"
      ? null
      : Math.max(1, parseInt(req.query.limit, 10) || 10);
    const offset = limit ? (page - 1) * limit : null;

    const { count, rows: employees } = await User.findAndCountAll({
      where,
      include: [
        {
          model: Profile,
          attributes: ["phone", "department", "designation", "resume"],
          where: Object.keys(profileWhere).length > 0 ? profileWhere : undefined,
          required: Object.keys(profileWhere).length > 0,
        },
      ],
      attributes: ["id", "name", "email", "role", "status", "createdAt", "updatedAt"],
      order: [["createdAt", "DESC"]],
      limit: limit || undefined,
      offset: offset !== null ? offset : undefined,
      distinct: true,
    });

    const formattedEmployees = employees.map((emp) => {
      const data = emp.toJSON ? emp.toJSON() : emp;
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status || "active",
        department: data.Profile?.department || null,
        designation: data.Profile?.designation || null,
        phone: data.Profile?.phone || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        Profile: data.Profile || null,
      };
    });

    const totalPages = limit ? Math.max(1, Math.ceil(count / limit)) : 1;

    return res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: {
        employees: formattedEmployees,
        pagination: {
          page,
          limit: limit || count,
          total: count,
          totalPages,
        },
      },
      employees: formattedEmployees,
      totalEmployees: count,
      pagination: {
        page,
        limit: limit || count,
        total: count,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get employees error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve employees.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * GET /api/admin/hr
 * Retrieve paginated HR team records with search and filtering.
 * Protected: Admin role only.
 */
export const getHRDirectory = async (req, res) => {
  try {
    const { search, department, status } = req.query;

    const where = {
      role: "hr",
    };

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: searchTerm } },
        { email: { [Op.like]: searchTerm } },
      ];
    }

    if (status && ["active", "inactive", "suspended"].includes(status.toLowerCase().trim())) {
      where.status = status.toLowerCase().trim();
    }

    const profileWhere = {};
    if (department && department.trim() && department.toLowerCase().trim() !== "all") {
      profileWhere.department = {
        [Op.like]: `%${department.trim()}%`,
      };
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = req.query.limit && req.query.limit.toLowerCase() === "all"
      ? null
      : Math.max(1, parseInt(req.query.limit, 10) || 10);
    const offset = limit ? (page - 1) * limit : null;

    const { count, rows: hrUsers } = await User.findAndCountAll({
      where,
      include: [
        {
          model: Profile,
          attributes: ["phone", "department", "designation"],
          where: Object.keys(profileWhere).length > 0 ? profileWhere : undefined,
          required: Object.keys(profileWhere).length > 0,
        },
      ],
      attributes: ["id", "name", "email", "role", "status", "createdAt", "updatedAt"],
      order: [["createdAt", "DESC"]],
      limit: limit || undefined,
      offset: offset !== null ? offset : undefined,
      distinct: true,
    });

    const formattedHR = hrUsers.map((hr) => {
      const data = hr.toJSON ? hr.toJSON() : hr;
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status || "active",
        department: data.Profile?.department || "Human Resources",
        designation: data.Profile?.designation || "HR Specialist",
        phone: data.Profile?.phone || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        Profile: data.Profile || null,
      };
    });

    const totalPages = limit ? Math.max(1, Math.ceil(count / limit)) : 1;

    return res.status(200).json({
      success: true,
      message: "HR team retrieved successfully",
      data: {
        hrUsers: formattedHR,
        pagination: {
          page,
          limit: limit || count,
          total: count,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Get HR directory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve HR team.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * GET /api/admin/candidates
 * Retrieve candidate directory from Candidate model with referral counts.
 * Protected: Admin role only.
 */
export const getCandidateDirectory = async (req, res) => {
  try {
    const { search, verified } = req.query;

    const where = {};

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: searchTerm } },
        { email: { [Op.like]: searchTerm } },
        { phone: { [Op.like]: searchTerm } },
      ];
    }

    if (verified === "true") {
      where.emailVerified = true;
    } else if (verified === "false") {
      where.emailVerified = false;
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = req.query.limit && req.query.limit.toLowerCase() === "all"
      ? null
      : Math.max(1, parseInt(req.query.limit, 10) || 10);
    const offset = limit ? (page - 1) * limit : null;

    const { count, rows: candidates } = await Candidate.findAndCountAll({
      where,
      attributes: ["id", "name", "email", "phone", "emailVerified", "userId", "resume", "createdAt", "updatedAt"],
      order: [["createdAt", "DESC"]],
      limit: limit || undefined,
      offset: offset !== null ? offset : undefined,
    });

    // Fetch referral counts and latest referral status for each candidate
    const candidateIds = candidates.map((c) => c.id);
    let referralMap = {};
    if (candidateIds.length > 0) {
      const referrals = await Referral.findAll({
        where: { candidateId: { [Op.in]: candidateIds } },
        attributes: ["id", "candidateId", "status", "jobId", "createdAt"],
        include: [
          {
            model: Job,
            attributes: ["id", "title", "department"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      referrals.forEach((ref) => {
        if (!referralMap[ref.candidateId]) {
          referralMap[ref.candidateId] = {
            totalReferrals: 0,
            latestStatus: ref.status,
            latestJob: ref.Job ? ref.Job.title : null,
          };
        }
        referralMap[ref.candidateId].totalReferrals += 1;
      });
    }

    const formattedCandidates = candidates.map((c) => {
      const plain = c.toJSON();
      const meta = referralMap[plain.id] || { totalReferrals: 0, latestStatus: "none", latestJob: null };
      
      let hasResume = Boolean(plain.resume);
      let resumeName = null;
      if (typeof plain.resume === "string") {
        resumeName = path.basename(plain.resume);
      } else if (Buffer.isBuffer(plain.resume)) {
        resumeName = "resume.pdf";
      }

      delete plain.resume; // Do not send raw buffer

      return {
        ...plain,
        hasResume,
        resumeName,
        totalReferrals: meta.totalReferrals,
        latestStatus: meta.latestStatus,
        latestJob: meta.latestJob,
      };
    });

    const totalPages = limit ? Math.max(1, Math.ceil(count / limit)) : 1;

    return res.status(200).json({
      success: true,
      message: "Candidates retrieved successfully",
      data: {
        candidates: formattedCandidates,
        pagination: {
          page,
          limit: limit || count,
          total: count,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Get candidate directory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve candidates.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * GET /api/admin/jobs
 * System-wide job management with accurate referral counts and status filtering.
 * Protected: Admin role only.
 */
export const getAdminJobs = async (req, res) => {
  try {
    const { search, status, department } = req.query;

    const where = {};

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.like]: searchTerm } },
        { description: { [Op.like]: searchTerm } },
        { location: { [Op.like]: searchTerm } },
      ];
    }

    if (status && ["open", "closed"].includes(status.toLowerCase().trim())) {
      where.status = status.toLowerCase().trim();
    }

    if (department && department.trim() && department.toLowerCase().trim() !== "all") {
      where.department = { [Op.like]: `%${department.trim()}%` };
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = req.query.limit && req.query.limit.toLowerCase() === "all"
      ? null
      : Math.max(1, parseInt(req.query.limit, 10) || 10);
    const offset = limit ? (page - 1) * limit : null;

    const { count, rows: jobs } = await Job.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: limit || undefined,
      offset: offset !== null ? offset : undefined,
    });

    const jobIds = jobs.map((j) => j.id);
    let referralCounts = {};
    if (jobIds.length > 0) {
      const counts = await Referral.findAll({
        where: { jobId: { [Op.in]: jobIds } },
        attributes: ["jobId", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
        group: ["jobId"],
        raw: true,
      });
      counts.forEach((c) => {
        referralCounts[c.jobId] = parseInt(c.count, 10);
      });
    }

    const formattedJobs = jobs.map((job) => {
      const plain = job.toJSON();
      plain.referralCount = referralCounts[plain.id] || 0;
      return plain;
    });

    const totalPages = limit ? Math.max(1, Math.ceil(count / limit)) : 1;

    return res.status(200).json({
      success: true,
      message: "Jobs retrieved successfully",
      data: {
        jobs: formattedJobs,
        pagination: {
          page,
          limit: limit || count,
          total: count,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Get admin jobs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve jobs.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * PATCH /api/admin/jobs/:id/status
 * Toggle or update job status between open and closed.
 * Protected: Admin role only.
 */
export const toggleJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const newStatus = status ? status.toLowerCase().trim() : job.status === "open" ? "closed" : "open";
    if (!["open", "closed"].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job status",
      });
    }

    await job.update({ status: newStatus });

    // Log action to MongoDB ActivityLog
    try {
      await ActivityLog.create({
        userId: req.user.id,
        action: "JOB_STATUS_UPDATED",
        details: `Job "${job.title}" status changed to ${newStatus}`,
      });
    } catch (logErr) {
      console.warn("ActivityLog create warning:", logErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Job successfully marked as ${newStatus}`,
      data: { job },
    });
  } catch (error) {
    console.error("Toggle job status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update job status.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * GET /api/admin/referrals
 * System-wide referral management with search, status filtering, and pagination.
 * Protected: Admin role only.
 */
export const getAdminReferrals = async (req, res) => {
  try {
    const { search, status } = req.query;

    const where = {};
    if (status && status.toLowerCase().trim() !== "all") {
      where.status = status.toLowerCase().trim();
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = req.query.limit && req.query.limit.toLowerCase() === "all"
      ? null
      : Math.max(1, parseInt(req.query.limit, 10) || 10);
    const offset = limit ? (page - 1) * limit : null;

    // Search condition across candidate name/email or job title
    const candidateWhere = {};
    const jobWhere = {};
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      candidateWhere[Op.or] = [
        { name: { [Op.like]: term } },
        { email: { [Op.like]: term } },
      ];
    }

    const { count, rows: referrals } = await Referral.findAndCountAll({
      where,
      include: [
        {
          model: Candidate,
          attributes: ["id", "name", "email", "phone", "emailVerified", "resume"],
          where: Object.keys(candidateWhere).length > 0 ? candidateWhere : undefined,
          required: Object.keys(candidateWhere).length > 0,
        },
        {
          model: Job,
          attributes: ["id", "title", "department", "location", "status"],
          where: Object.keys(jobWhere).length > 0 ? jobWhere : undefined,
          required: Object.keys(jobWhere).length > 0,
        },
        {
          model: User,
          as: "Employee",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit || undefined,
      offset: offset !== null ? offset : undefined,
      distinct: true,
    });

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

    const totalPages = limit ? Math.max(1, Math.ceil(count / limit)) : 1;

    return res.status(200).json({
      success: true,
      message: "Referrals retrieved successfully",
      data: {
        referrals: sanitizedReferrals,
        pagination: {
          page,
          limit: limit || count,
          total: count,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Get admin referrals error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve referrals.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * GET /api/admin/activity-logs
 * Paginated read-only activity logs from MongoDB with actor details from MySQL.
 * Protected: Admin role only.
 */
export const getActivityLogs = async (req, res) => {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Activity log service is currently unavailable.",
      });
    }

    const { action, search } = req.query;
    const query = {};

    if (action && action.trim() && action.toLowerCase().trim() !== "all") {
      query.action = action.trim();
    }

    if (search && search.trim()) {
      query.$or = [
        { action: { $regex: search.trim(), $options: "i" } },
        { details: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 15);
    const skip = (page - 1) * limit;

    const [total, rawLogs] = await Promise.all([
      ActivityLog.countDocuments(query),
      ActivityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    // Resolve user IDs to MySQL User records
    const userIds = [...new Set(rawLogs.map((l) => l.userId).filter(Boolean))];
    let usersMap = {};
    if (userIds.length > 0) {
      const users = await User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ["id", "name", "email", "role"],
        raw: true,
      });
      users.forEach((u) => {
        usersMap[u.id] = u;
      });
    }

    const logs = rawLogs.map((log) => ({
      _id: log._id,
      userId: log.userId,
      action: log.action,
      details: log.details,
      referralId: log.referralId || null,
      createdAt: log.createdAt,
      actor: usersMap[log.userId] || { id: log.userId, name: `User #${log.userId}`, email: "N/A", role: "unknown" },
    }));

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      success: true,
      message: "Activity logs retrieved successfully",
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Get activity logs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve activity logs.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * GET /api/admin/email-history
 * Paginated read-only email delivery history from MongoDB.
 * Protected: Admin role only.
 */
export const getEmailHistory = async (req, res) => {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Email history service is currently unavailable.",
      });
    }

    const { templateType, status, search } = req.query;
    const query = {};

    if (templateType && templateType.trim() && templateType.toLowerCase().trim() !== "all") {
      query.templateType = templateType.toLowerCase().trim();
    }

    if (status && status.trim() && status.toLowerCase().trim() !== "all") {
      query.status = status.toLowerCase().trim();
    }

    if (search && search.trim()) {
      query.$or = [
        { recipient: { $regex: search.trim(), $options: "i" } },
        { errorMessage: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 15);
    const skip = (page - 1) * limit;

    const [total, rawEmails] = await Promise.all([
      EmailHistory.countDocuments(query),
      EmailHistory.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    // Resolve sender user IDs to MySQL User records
    const userIds = [...new Set(rawEmails.map((e) => e.userId).filter(Boolean))];
    let usersMap = {};
    if (userIds.length > 0) {
      const users = await User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ["id", "name", "email", "role"],
        raw: true,
      });
      users.forEach((u) => {
        usersMap[u.id] = u;
      });
    }

    const emails = rawEmails.map((item) => ({
      _id: item._id,
      referralId: item.referralId,
      userId: item.userId,
      recipient: item.recipient,
      templateType: item.templateType,
      status: item.status,
      errorMessage: item.errorMessage || "",
      createdAt: item.createdAt,
      sender: usersMap[item.userId] || { id: item.userId, name: `User #${item.userId}`, email: "N/A", role: "unknown" },
    }));

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      success: true,
      message: "Email history retrieved successfully",
      data: {
        emails,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Get email history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve email history.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
