import express from "express";
import Transaction from "../models/Transaction.js";
import OpeningBalance from "../models/OpeningBalance.js";

const router = express.Router();

router.get("/transaction/opening", async (req, res) => {
  try {
    const balance = await OpeningBalance.findOne({ ownerId: req.user.uid });
    if (!balance) {
      return res.json({ cash: 0, online: 0 });
    }
    return res.json(balance);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load opening balances" });
  }
});

router.post("/transaction/opening", async (req, res) => {
  const cash = Number(req.body?.cash ?? 0);
  const online = Number(req.body?.online ?? 0);

  if (!Number.isFinite(cash) || cash < 0 || !Number.isFinite(online) || online < 0) {
    return res.status(400).json({ message: "Invalid opening balance amounts" });
  }

  try {
    const balance = await OpeningBalance.findOneAndUpdate(
      { ownerId: req.user.uid },
      { ownerId: req.user.uid, cash, online },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.json(balance);
  } catch (err) {
    return res.status(500).json({ message: "Failed to save opening balances" });
  }
});

router.post("/transaction", async (req, res) => {
  const { type, amount } = req.body;
  const amt = Number(amount);

  if (!type || !Number.isFinite(amt) || amt < 0) {
    return res.status(400).json({ message: "Invalid transaction data" });
  }

  try {
    const transaction = await Transaction.create({ ownerId: req.user.uid, type, amount: amt });
    res.json({ message: "Transaction saved", transaction });
  } catch (err) {
    res.status(500).json({ message: "Failed to save transaction" });
  }
});

router.get("/transaction", async (req, res) => {
  try {
    const transactions = await Transaction.find({ ownerId: req.user.uid }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Failed to load transactions" });
  }
});

export default router;
