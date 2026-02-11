import mongoose from "mongoose";

const adminProfileSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    name: { type: String, required: true, trim: true },
    shopName: { type: String, required: true, trim: true },
    gstNumber: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("AdminProfile", adminProfileSchema, "admin");
