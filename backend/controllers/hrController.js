import { Op } from "sequelize";
import mongoose from "mongoose";
import sequelize from "../config/database.js";
import { Job, Referral, Candidate, User } from "../models/associations.js";
import ActivityLog from "../models/mongo/ActivityLog.js";

/**
 * GET /api/hr/dashboard
 * Retrieve aggregated recruitment metrics, pipeline distribution,
 * recent referrals, recent jobs, and recruitment activity log.
 * Accessible by HR and Admin roles.
 */
export const getHRDashboard = async (req, res) => {
  try {
    // 1. Concurrent aggregate counts for high performance
    const [
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

    const pendingReview = referredCount + underReviewCount;

    // 2. Structured referral pipeline breakdown
    const pipeline = [
      {
        status: "referred",
        label: "Submitted",
        count: referredCount,
        percentage: totalReferrals > 0 ? Math.round((referredCount / totalReferrals) * 100) : 0,
        color: "bg-blue-500",
      },
      {
        status: "under_review",
        label: "Under Review",
        count: underReviewCount,
        percentage: totalReferrals > 0 ? Math.round((underReviewCount / totalReferrals) * 100) : 0,
        color: "bg-amber-500",
      },
      {
        status: "shortlisted",
        label: "Shortlisted",
        count: shortlistedCount,
        percentage: totalReferrals > 0 ? Math.round((shortlistedCount / totalReferrals) * 100) : 0,
        color: "bg-indigo-500",
      },
      {
        status: "interview",
        label: "Interview",
        count: interviewCount,
        percentage: totalReferrals > 0 ? Math.round((interviewCount / totalReferrals) * 100) : 0,
        color: "bg-purple-500",
      },
      {
        status: "selected",
        label: "Selected / Hired",
        count: selectedCount,
        percentage: totalReferrals > 0 ? Math.round((selectedCount / totalReferrals) * 100) : 0,
        color: "bg-emerald-500",
      },
      {
        status: "rejected",
        label: "Rejected",
        count: rejectedCount,
        percentage: totalReferrals > 0 ? Math.round((rejectedCount / totalReferrals) * 100) : 0,
        color: "bg-rose-500",
      },
    ];

    // 3. Recent 5 referrals
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

    // 4. Recent 5 jobs with referral counts
    const recentJobs = await Job.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "title", "department", "location", "status", "createdAt"],
    });

    const jobIds = recentJobs.map((j) => j.id);
    let referralCountMap = {};
    if (jobIds.length > 0) {
      const counts = await Referral.findAll({
        where: { jobId: { [Op.in]: jobIds } },
        attributes: ["jobId", [sequelize.fn("COUNT", sequelize.col("id")), "referralCount"]],
        group: ["jobId"],
        raw: true,
      });
      counts.forEach((c) => {
        referralCountMap[c.jobId] = parseInt(c.referralCount, 10);
      });
    }

    const jobsWithMetrics = recentJobs.map((job) => {
      const plain = job.toJSON();
      plain.referralCount = referralCountMap[plain.id] || 0;
      return plain;
    });

    // 5. Recent recruitment activity from MongoDB ActivityLog
    let recentActivity = [];
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        recentActivity = await ActivityLog.find()
          .sort({ createdAt: -1 })
          .limit(6)
          .lean();
      } catch (mongoError) {
        console.warn("MongoDB ActivityLog retrieval note:", mongoError.message);
        recentActivity = [];
      }
    }

    return res.status(200).json({
      success: true,
      message: "HR Dashboard data fetched successfully",
      data: {
        metrics: {
          totalJobs,
          openJobs,
          closedJobs,
          totalReferrals,
          pendingReview,
          shortlisted: shortlistedCount,
          interview: interviewCount,
          selected: selectedCount,
          rejected: rejectedCount,
        },
        pipeline,
        recentReferrals,
        recentJobs: jobsWithMetrics,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Get HR dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve HR dashboard data. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
