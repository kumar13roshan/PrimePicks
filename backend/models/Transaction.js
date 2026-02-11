import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  type: { type: String, required: true, trim: true }, // "cash" or "online"
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now }
});

export default mongoose.model("Transaction", transactionSchema);
