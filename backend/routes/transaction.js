import express from "express";
import Transaction from "../models/Transaction.js";

const router = express.Router();

router.post("/transaction", async (req, res) => {
  const { type, amount } = req.body;
  const amt = Number(amount);

  if (!type || !Number.isFinite(amt) || amt < 0) {
    return res.status(400).json({ message: "Invalid transaction data" });
  }

  try {
    const transaction = await Transaction.create({ type, amount: amt });
    res.json({ message: "Transaction saved", transaction });
  } catch (err) {
    res.status(500).json({ message: "Failed to save transaction" });
  }
});

router.get("/transaction", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Failed to load transactions" });
  }
});

export default router;
