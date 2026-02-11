import express from "express";
import mongoose from "mongoose";
import Purchase from "../models/Purchase.js";
import Stock from "../models/Stock.js";

const router = express.Router();

// GET ALL PURCHASES
router.get("/purchase", async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ purchaseDate: -1, date: -1 });
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: "Failed to load purchases" });
  }
});

// ADD PURCHASE
router.post("/purchase", async (req, res) => {
  const {
    itemName,
    quantity,
    price,
    unit,
    supplierName,
    supplierPhone,
    supplierGstNumber,
    supplierEmail,
    supplierAddress,
    invoiceNumber,
    purchaseDate,
    notes
  } = req.body;

  const qty = Number(quantity);
  const unitPrice = Number(price);
  const normalizedUnit = typeof unit === "string" ? unit.trim() : "";
  const parsedDate = new Date(purchaseDate);
  const dateIsValid = purchaseDate && !Number.isNaN(parsedDate.getTime());

  if (
    !itemName ||
    !Number.isFinite(qty) ||
    qty <= 0 ||
    !Number.isFinite(unitPrice) ||
    unitPrice < 0 ||
    !normalizedUnit ||
    !supplierName ||
    !supplierPhone ||
    !dateIsValid
  ) {
    return res.status(400).json({ message: "Invalid purchase data" });
  }

  try {
    const existingStock = await Stock.findOne({ itemName });
    if (existingStock?.unit && existingStock.unit !== normalizedUnit) {
      return res.status(400).json({
        message: `Unit mismatch. ${itemName} is tracked in ${existingStock.unit}.`,
      });
    }

    const purchase = await Purchase.create({
      itemName,
      quantity: qty,
      price: unitPrice,
      unit: normalizedUnit,
      supplierName,
      supplierPhone,
      supplierGstNumber,
      supplierEmail,
      supplierAddress,
      invoiceNumber,
      purchaseDate: parsedDate,
      notes,
    });

    let stock;
    try {
      stock = await Stock.findOneAndUpdate(
        { itemName },
        { $inc: { quantity: qty }, $set: { price: unitPrice, unit: normalizedUnit } },
        { new: true, upsert: true }
      );
    } catch (err) {
      await Purchase.deleteOne({ _id: purchase._id });
      throw err;
    }

    res.json({
      message: "Purchase added + stock updated",
      ...purchase.toObject(),
      stock,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to add purchase" });
  }
});

// DELETE PURCHASE (with stock rollback)
router.delete("/purchase/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid purchase id" });
  }

  try {
    const purchase = await Purchase.findById(id);

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    const stock = await Stock.findOne({ itemName: purchase.itemName });
    if (stock) {
      stock.quantity = Math.max(0, stock.quantity - purchase.quantity);
      await stock.save();
    }

    try {
      await Purchase.deleteOne({ _id: purchase._id });
    } catch (err) {
      if (stock) {
        stock.quantity += purchase.quantity;
        await stock.save();
      }
      throw err;
    }

    res.json({ message: "Purchase deleted + stock updated", stock });
  } catch (err) {
    console.error("Failed to delete purchase:", err);
    res.status(500).json({ message: "Failed to delete purchase" });
  }
});

export default router;
