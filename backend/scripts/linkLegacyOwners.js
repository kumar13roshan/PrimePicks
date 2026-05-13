import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ quiet: true });

const args = process.argv.slice(2);
const email = String(args[0] || "").trim().toLowerCase();
const shouldApply = args.includes("--apply");
const ownerIds = args
  .slice(1)
  .filter((arg) => arg !== "--apply")
  .map((ownerId) => String(ownerId || "").trim())
  .filter(Boolean);

if (!email || !ownerIds.length) {
  console.error("Usage: node scripts/linkLegacyOwners.js <email> <owner-id> [owner-id...] [--apply]");
  process.exit(1);
}

const mask = (value) => {
  const text = String(value || "");
  return text.length > 10 ? `${text.slice(0, 6)}...${text.slice(-4)}` : text;
};

try {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const user = await db.collection("users").findOne({ email });

  if (!user?._id) {
    throw new Error(`No user found for ${email}`);
  }

  const currentOwnerIds = Array.isArray(user.legacyOwnerIds) ? user.legacyOwnerIds : [];
  const nextOwnerIds = [...new Set([...currentOwnerIds, ...ownerIds])];

  console.log("user", email, mask(user._id));
  console.log("currentLegacyOwners", currentOwnerIds.map(mask));
  console.log("nextLegacyOwners", nextOwnerIds.map(mask));
  console.log("mode", shouldApply ? "apply" : "dry-run");

  if (shouldApply) {
    await db.collection("users").updateOne({ _id: user._id }, { $set: { legacyOwnerIds: nextOwnerIds } });
    console.log("linked", ownerIds.map(mask));
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
