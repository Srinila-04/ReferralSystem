import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Candidate = sequelize.define("Candidate", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  resume: {
    type: DataTypes.BLOB("long"),
    allowNull: true,
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

export default Candidate;