import express from "express";
import AdminProfile from "../models/AdminProfile.js";
import User from "../models/User.js";
import { createToken, hashPassword, verifyPassword } from "../utils/auth.js";

const router = express.Router();

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const sanitizeUser = (user) => ({
  uid: String(user._id),
  email: normalizeEmail(user.email),
  name: String(user.name || "").trim(),
  legacyOwnerIds: Array.isArray(user.legacyOwnerIds)
    ? user.legacyOwnerIds.map((ownerId) => String(ownerId || "").trim()).filter(Boolean)
    : [],
});

router.post("/auth/signup", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const shopName = String(req.body?.shopName || "").trim();
  const gstNumber = String(req.body?.gstNumber || "").trim();
  const address = String(req.body?.address || "").trim();
  const phone = String(req.body?.phone || "").replace(/\D/g, "");

  if (!name || !email || password.length < 6 || !shopName || !gstNumber || !address || phone.length !== 10) {
    return res.status(400).json({
      message: "Name, email, password, shop name, GST number, address, and a 10 digit phone number are required.",
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: hashPassword(password),
    });

    try {
      await AdminProfile.create({
        ownerId: String(user._id),
        email,
        name,
        shopName,
        gstNumber,
        address,
        phone,
      });
    } catch (error) {
      await User.deleteOne({ _id: user._id });
      throw error;
    }

    return res.status(201).json({
      token: createToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create account." });
  }
});

router.post("/auth/login", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.json({
      token: createToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to sign in." });
  }
});

export default router;
