import express from "express";
import AdminProfile from "../models/AdminProfile.js";

const router = express.Router();

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

router.get("/admin", async (req, res) => {
  const email = normalizeEmail(req.query.email);

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const profile = await AdminProfile.findOne({ email });
    if (!profile) {
      return res.status(404).json({ message: "Admin profile not found" });
    }
    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load admin profile" });
  }
});

router.post("/admin", async (req, res) => {
  const { email, name, shopName, gstNumber, address, phone } = req.body;

  const normalizedEmail = normalizeEmail(email);
  const normalizedName = String(name || "").trim();
  const normalizedShopName = String(shopName || "").trim();
  const normalizedGstNumber = String(gstNumber || "").trim();
  const normalizedAddress = String(address || "").trim();
  const normalizedPhone = String(phone || "").trim();

  if (
    !normalizedEmail ||
    !normalizedName ||
    !normalizedShopName ||
    !normalizedGstNumber ||
    !normalizedAddress
  ) {
    return res.status(400).json({ message: "Missing required admin details" });
  }

  try {
    const profile = await AdminProfile.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        name: normalizedName,
        shopName: normalizedShopName,
        gstNumber: normalizedGstNumber,
        address: normalizedAddress,
        phone: normalizedPhone,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ message: "Failed to save admin profile" });
  }
});

export default router;
