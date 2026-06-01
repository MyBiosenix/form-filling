const mongoose = require("mongoose");

const finalReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    formNo: {
      type: Number,
      required: true
    },

    mistakes: {
      type: Number,
      required: true
    },

    mistakePercent: {
      type: Number,
      required: true
    },

    mistakePercentValue: {
      type: Number,
      default: 0
    },

    totalFields: {
      type: Number,
      default: 0
    },

    accuracy: {
      type: Number,
      default: 0
    },

    errorType: {
      type: String,
      default: "Major mismatch"
    },

    isSelected: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

finalReportSchema.index(
  { userId: 1, formNo: 1 },
  { unique: true }
);
finalReportSchema.index({ userId: 1, isSelected: 1, formNo: 1 });
finalReportSchema.index({ userId: 1, createdAt: -1 });
finalReportSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("FinalReport", finalReportSchema);
