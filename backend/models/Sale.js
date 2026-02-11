import mongoose from "mongoose";

const saleSchema = new mongoose.Schema({
  itemName: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, trim: true, default: "pcs" },
  paymentType: { type: String, required: true, trim: true },
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true, trim: true },
  customerGstNumber: { type: String, trim: true },
  customerEmail: { type: String, trim: true },
  customerAddress: { type: String, trim: true },
  invoiceNumber: { type: String, required: true, trim: true },
  saleDate: { type: Date, required: true },
  date: { type: Date, default: Date.now }
});

export default mongoose.model("Sale", saleSchema);
