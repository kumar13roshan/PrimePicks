import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
  itemName: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, trim: true, default: "pcs" }
});

export default mongoose.model("Stock", stockSchema);
