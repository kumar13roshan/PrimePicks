import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },
  itemName: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, trim: true, default: "pcs" },
  supplierName: { type: String, required: true, trim: true },
  supplierPhone: { type: String, required: true, trim: true },
  supplierGstNumber: { type: String, trim: true },
  supplierEmail: { type: String, trim: true },
  supplierAddress: { type: String, trim: true },
  invoiceNumber: { type: String, trim: true },
  purchaseDate: { type: Date, required: true },
  notes: { type: String, trim: true },
  date: { type: Date, default: Date.now }
});

export default mongoose.model("Purchase", purchaseSchema);
