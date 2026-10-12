
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const EmailVerification = sequelize.define("EmailVerification", {
  candidateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  token: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

export default EmailVerification;
