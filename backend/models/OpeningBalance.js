import mongoose from "mongoose";

const openingBalanceSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true, index: true, unique: true },
    cash: { type: Number, default: 0, min: 0 },
    online: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("OpeningBalance", openingBalanceSchema);
