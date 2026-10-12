import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Profile = sequelize.define("Profile", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  designation: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  resume: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

export default Profile;