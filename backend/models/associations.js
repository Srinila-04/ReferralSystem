import User from "./User.js";
import Profile from "./Profile.js";
import Job from "./Job.js";
import Candidate from "./Candidate.js";
import Referral from "./Referral.js";
import RefreshToken from "./RefreshToken.js";

// User → Profile
User.hasOne(Profile, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});

Profile.belongsTo(User, {
  foreignKey: "userId",
});

// User → Jobs
User.hasMany(Job, {
  foreignKey: "createdBy",
});

Job.belongsTo(User, {
  foreignKey: "createdBy",
});

// User → Referrals
User.hasMany(Referral, {
  foreignKey: "employeeId",
});

Referral.belongsTo(User, {
  foreignKey: "employeeId",
  as: "Employee"
});

// Candidate → Referrals
Candidate.hasMany(Referral, {
  foreignKey: "candidateId",
});

Referral.belongsTo(Candidate, {
  foreignKey: "candidateId",
});

// Job → Referrals
Job.hasMany(Referral, {
  foreignKey: "jobId",
});

Referral.belongsTo(Job, {
  foreignKey: "jobId",
});

User.hasMany(RefreshToken, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});

RefreshToken.belongsTo(User, {
  foreignKey: "userId",
});

User.hasOne(Candidate, {
  foreignKey: "userId",
  onDelete: "SET NULL",
});

Candidate.belongsTo(User, {
  foreignKey: "userId",
});

export {
  User,
  Profile,
  Job,
  Candidate,
  Referral,
};