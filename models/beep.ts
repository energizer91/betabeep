import mongoose from "mongoose";

const beepSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ["GET", "POST"],
    default: "POST",
  },
  name: {
    type: String,
    required: true,
  },
  waitForResponse: {
    type: Boolean,
    default: true,
  },
  variables: {
    type: Object,
    default: {},
  },
  timeout: {
    type: Number,
    default: 30000,
  },
});

export const Beep = mongoose.model("Beep", beepSchema);
