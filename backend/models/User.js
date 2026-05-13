import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    legacyOwnerIds: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
