import express from "express";
import mongoose from "mongoose";
import Sale from "../models/Sale.js";
import Stock from "../models/Stock.js";

const router = express.Router();

// POST SALE
router.post("/sale", async (req, res) => {
  const {
    itemName,
    quantity,
    price,
    unit,
    paymentType,
    customerName,
    customerPhone,
    customerGstNumber,
    customerEmail,
    customerAddress,
    invoiceNumber,
    saleDate
  } = req.body;
  const qty = Number(quantity);
  const unitPrice = Number(price);
  const normalizedUnit = typeof unit === "string" ? unit.trim() : "";
  const parsedDate = new Date(saleDate);
  const dateIsValid = saleDate && !Number.isNaN(parsedDate.getTime());

  if (
    !itemName ||
    !Number.isFinite(qty) ||
    qty <= 0 ||
    !Number.isFinite(unitPrice) ||
    unitPrice < 0 ||
    !paymentType ||
    !customerName ||
    !customerPhone ||
    !invoiceNumber ||
    !dateIsValid
  ) {
    return res.status(400).json({ message: "Invalid sale data" });
  }

  try {
    const stockDoc = await Stock.findOne({ itemName });

    if (!stockDoc) {
      return res.status(400).json({ message: "Not enough stock" });
    }

    if (normalizedUnit && stockDoc.unit && stockDoc.unit !== normalizedUnit) {
      return res.status(400).json({
        message: `Unit mismatch. ${itemName} is tracked in ${stockDoc.unit}.`,
      });
    }

    const saleUnit = stockDoc.unit || normalizedUnit || "pcs";
    const stock = await Stock.findOneAndUpdate(
      { _id: stockDoc._id, quantity: { $gte: qty } },
      { $inc: { quantity: -qty }, $set: { unit: saleUnit } },
      { new: true }
    );

    if (!stock) {
      return res.status(400).json({ message: "Not enough stock" });
    }

    let sale;
    try {
      sale = await Sale.create({
        itemName,
        quantity: qty,
        price: unitPrice,
        unit: saleUnit,
        paymentType,
        customerName,
        customerPhone,
        customerGstNumber,
        customerEmail,
        customerAddress,
        invoiceNumber,
        saleDate: parsedDate,
      });
    } catch (err) {
      await Stock.updateOne({ _id: stock._id }, { $inc: { quantity: qty } });
      throw err;
    }

    res.json({
      message: "Sale processed",
      ...sale.toObject(),
      stock,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to process sale" });
  }
});

// GET SALES
router.get("/sale", async (req, res) => {
  try {
    const sales = await Sale.find().sort({ saleDate: -1, date: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: "Failed to load sales" });
  }
});

// 🔥 DELETE SALE + RESTORE STOCK
router.delete("/sale/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid sale id" });
  }

  try {
    const sale = await Sale.findById(id);

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    const stock = await Stock.findOneAndUpdate(
      { itemName: sale.itemName },
      {
        $inc: { quantity: sale.quantity },
        $setOnInsert: { price: sale.price, unit: sale.unit || "pcs" },
      },
      { new: true, upsert: true }
    );

    try {
      await Sale.deleteOne({ _id: sale._id });
    } catch (err) {
      await Stock.updateOne({ _id: stock._id }, { $inc: { quantity: -sale.quantity } });
      throw err;
    }

    res.json({ message: "Sale deleted + stock restored", stock });
  } catch (err) {
    console.error("Failed to delete sale:", err);
    res.status(500).json({ message: "Failed to delete sale" });
  }
});

export default router;
