import { Job, Referral, Candidate } from "../models/associations.js";

/**
 * GET /api/employee/dashboard
 * Retrieve authenticated employee-specific metrics, recent open jobs,
 * and the logged-in employee's recent referrals.
 * Restricted to authenticated Employee users.
 */
export const getEmployeeDashboard = async (req, res) => {
  try {
    const employeeId = req.user.id;

    // Concurrently fetch employee-specific metrics, recent open jobs, and employee's recent referrals
    const [
      totalReferrals,
      referredCount,
      underReviewCount,
      shortlistedCount,
      interviewCount,
      selectedCount,
      rejectedCount,
      recentJobs,
      recentReferrals,
    ] = await Promise.all([
      Referral.count({ where: { employeeId } }),
      Referral.count({ where: { employeeId, status: "referred" } }),
      Referral.count({ where: { employeeId, status: "under_review" } }),
      Referral.count({ where: { employeeId, status: "shortlisted" } }),
      Referral.count({ where: { employeeId, status: "interview" } }),
      Referral.count({ where: { employeeId, status: "selected" } }),
      Referral.count({ where: { employeeId, status: "rejected" } }),
      // Up to 4 active open jobs eligible for referral
      Job.findAll({
        where: { status: "open" },
        attributes: [
          "id",
          "title",
          "department",
          "location",
          "experience",
          "description",
          "status",
          "createdAt",
        ],
        order: [["createdAt", "DESC"]],
        limit: 4,
      }),
      // Latest 5 referrals submitted by this employee with associated candidate and job info
      Referral.findAll({
        where: { employeeId },
        include: [
          {
            model: Candidate,
            attributes: ["id", "name", "email", "phone"],
          },
          {
            model: Job,
            attributes: ["id", "title", "department", "location", "status"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: 5,
      }),
    ]);

    const pendingReview = referredCount + underReviewCount;
    const hired = selectedCount;

    return res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalReferrals,
          pendingReview,
          shortlisted: shortlistedCount,
          hired,
          interview: interviewCount,
          rejected: rejectedCount,
          referred: referredCount,
          underReview: underReviewCount,
        },
        recentJobs,
        recentReferrals,
      },
    });
  } catch (error) {
    console.error("Employee dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve employee dashboard data.",
    });
  }
};

