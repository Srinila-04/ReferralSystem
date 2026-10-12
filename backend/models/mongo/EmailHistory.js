
import mongoose from "mongoose";

const emailHistorySchema = new mongoose.Schema(
  {
    referralId: {
      type: Number,
      required: true,
    },
    userId: {
      type: Number,
      required: true,
    },
    recipient: {
      type: String,
      required: true,
    },
    templateType: {
      type: String,
      enum: ["shortlisted", "rejected"],
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      required: true,
    },
    errorMessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const EmailHistory = mongoose.model("EmailHistory", emailHistorySchema);

export default EmailHistory;
