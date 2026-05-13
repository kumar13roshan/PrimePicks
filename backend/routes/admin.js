import express from "express";
import AdminProfile from "../models/AdminProfile.js";
import { ownerFilter } from "../utils/ownership.js";

const router = express.Router();

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

router.get("/admin", async (req, res) => {
  const emailFromToken = normalizeEmail(req.user?.email);
  const emailFromQuery = normalizeEmail(req.query.email);
  const email = emailFromQuery || emailFromToken;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (emailFromToken && emailFromQuery && emailFromToken !== emailFromQuery) {
    return res.status(403).json({ message: "Email mismatch" });
  }

  try {
    const profile = await AdminProfile.findOne({
      ...ownerFilter(req.user),
      email,
    });
    if (!profile) {
      return res.status(404).json({ message: "Admin profile not found" });
    }
    return res.json(profile);
  } catch (err) {
    console.error("Load admin profile error:", err.message);
    return res.status(500).json({ message: "Failed to load admin profile" });
  }
});

router.get("/me", (req, res) => {
  return res.json({
    uid: req.user?.uid || "",
    email: req.user?.email || "",
  });
});

router.post("/admin", async (req, res) => {
  const { email, name, shopName, gstNumber, address, phone } = req.body;

  const emailFromToken = normalizeEmail(req.user?.email);
  const emailFromBody = normalizeEmail(email);
  const normalizedEmail = emailFromToken || emailFromBody;
  const normalizedName = String(name || "").trim();
  const normalizedShopName = String(shopName || "").trim();
  const normalizedGstNumber = String(gstNumber || "").trim();
  const normalizedAddress = String(address || "").trim();
  const normalizedPhone = String(phone || "").replace(/\D/g, "");

  if (
    !normalizedEmail ||
    !normalizedName ||
    !normalizedShopName ||
    !normalizedGstNumber ||
    !normalizedAddress ||
    normalizedPhone.length !== 10
  ) {
    return res.status(400).json({ message: "Missing required admin details" });
  }

  if (emailFromToken && emailFromBody && emailFromToken !== emailFromBody) {
    return res.status(403).json({ message: "Email mismatch" });
  }

  try {
    const existing = await AdminProfile.findOne({
      ...ownerFilter(req.user),
      email: normalizedEmail,
    });

    const profile = await AdminProfile.findOneAndUpdate(
      existing ? { _id: existing._id } : { ownerId: req.user.uid },
      {
        ownerId: req.user?.uid,
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
    console.error("Save admin profile error:", err.message, err.code);
    return res.status(500).json({ message: "Failed to save admin profile", detail: err.message });
  }
});

// ✅ NEW: Delete route
router.delete("/admin", async (req, res) => {
  try {
    await AdminProfile.findOneAndDelete(ownerFilter(req.user));
    return res.json({ message: "Admin profile deleted successfully" });
  } catch (err) {
    console.error("Delete admin profile error:", err.message);
    return res.status(500).json({ message: "Failed to delete admin profile" });
  }
});

export default router;
