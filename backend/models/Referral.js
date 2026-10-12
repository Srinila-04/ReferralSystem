import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Referral = sequelize.define("Referral", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  candidateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  jobId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  invitationToken: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },

  invitationExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  status: {
    type: DataTypes.ENUM(
      "referred",
      "under_review",
      "shortlisted",
      "interview",
      "selected",
      "rejected"
    ),
    defaultValue: "referred",
  },

  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

export default Referral;