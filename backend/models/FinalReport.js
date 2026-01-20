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
    }
  },
  { timestamps: true }
);

finalReportSchema.index(
  { userId: 1, formNo: 1 },
  { unique: true }
);

module.exports = mongoose.model("FinalReport", finalReportSchema);
