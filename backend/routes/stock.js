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
