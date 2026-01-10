const mongoose = require("mongoose");

const FormEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    formNo: {
      type: Number,
      required: true,
      index: true
    },

    excelRowId: {
      type: Number,
      required: true,
      index: true
    },

    responses: {
      type: Object,
      required: true
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { minimize: true }
);


module.exports = mongoose.model("FormEntry", FormEntrySchema);
