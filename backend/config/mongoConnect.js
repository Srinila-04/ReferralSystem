
import mongoose from "mongoose";

const mongoConnect = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/referral_logs");

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
};

export default mongoConnect;