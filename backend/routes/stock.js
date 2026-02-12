import express from "express";
import mongoose from "mongoose";
import Stock from "../models/Stock.js";

const router = express.Router();

router.get("/stock", async (req, res) => {
  try {
    const items = await Stock.find({ ownerId: req.user.uid }).sort({ itemName: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to load stock" });
  }
});

router.post("/stock/opening", async (req, res) => {
  const ownerId = req.user.uid;
  const name = String(req.body?.itemName || "").trim();
  const openingQty = Number(req.body?.openingQuantity);
  const unitPrice = req.body?.price === undefined ? NaN : Number(req.body?.price);
  const normalizedUnit = typeof req.body?.unit === "string" ? req.body.unit.trim() : "";

  if (!name || !Number.isFinite(openingQty) || openingQty < 0) {
    return res.status(400).json({ message: "Invalid opening stock data" });
  }

  try {
    const existing = await Stock.findOne({ ownerId, itemName: name });

    if (!existing) {
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return res.status(400).json({ message: "Price is required for new items" });
      }
      const stock = await Stock.create({
        ownerId,
        itemName: name,
        quantity: openingQty,
        openingQuantity: openingQty,
        price: unitPrice,
        unit: normalizedUnit || "pcs",
      });
      return res.json({ message: "Opening stock created", stock });
    }

    if (normalizedUnit && existing.unit && existing.unit !== normalizedUnit) {
      return res.status(400).json({
        message: `Unit mismatch. ${name} is tracked in ${existing.unit}.`,
      });
    }

    const currentOpening = Number(existing.openingQuantity || 0);
    const delta = openingQty - currentOpening;
    const updatedQuantity = Number(existing.quantity || 0) + delta;

    if (updatedQuantity < 0) {
      return res.status(400).json({
        message: "Opening stock cannot be reduced below sold quantity.",
      });
    }

    const updates = { openingQuantity: openingQty };
    if (Number.isFinite(unitPrice) && unitPrice >= 0) {
      updates.price = unitPrice;
    }
    if (normalizedUnit) {
      updates.unit = normalizedUnit;
    }

    const stock = await Stock.findOneAndUpdate(
      { _id: existing._id, ownerId },
      { $inc: { quantity: delta }, $set: updates },
      { new: true }
    );

    return res.json({ message: "Opening stock updated", stock });
  } catch (err) {
    return res.status(500).json({ message: "Failed to save opening stock" });
  }
});

router.delete("/stock/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.uid;
    let deleted = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      deleted = await Stock.findOneAndDelete({ _id: id, ownerId });
    }

    if (!deleted) {
      deleted = await Stock.findOneAndDelete({ itemName: id, ownerId });
    }

    if (!deleted) {
      return res.status(404).json({ message: "Stock item not found" });
    }

    res.json({ message: "Stock item deleted", item: deleted });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete stock item" });
  }
});

export default router;
