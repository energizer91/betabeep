import mongoose from "mongoose";

// used to track every loh record connected to beep
const recordSchema = new mongoose.Schema({
  type: {
    type: String,
    default: "log",
  },
  session: {
    type: String,
    required: true,
  },
  beepId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Beep", // This should match the name of the Beep model
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now, // Automatically set to current date and time
    expires: 60 * 60 * 24 * 30,
  },
  data: {
    type: String,
  },
});

export const Record = mongoose.model("Record", recordSchema);
