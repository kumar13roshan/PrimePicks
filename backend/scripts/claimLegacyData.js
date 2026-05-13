import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ quiet: true });

const args = process.argv.slice(2);
const email = args[0]?.trim().toLowerCase();
const legacyOwner = args[1];
const shouldApply = args.includes("--apply");

if (!email || !legacyOwner) {
  console.error("Usage: node scripts/claimLegacyData.js <email> <legacy-owner-prefix|blank> [--apply]");
  process.exit(1);
}

const collections = ["purchases", "sales", "stocks", "transactions", "openingbalances"];

const mask = (value) => {
  const text = String(value || "");
  return text.length > 10 ? `${text.slice(0, 6)}...${text.slice(-4)}` : text;
};

const findLegacyOwnerIds = async (db) => {
  if (legacyOwner === "blank") {
    return [null, ""];
  }

  const found = new Set();

  for (const collection of collections) {
    const exists = await db.listCollections({ name: collection }).hasNext();
    if (!exists) continue;

    const owners = await db.collection(collection).distinct("ownerId", {
      ownerId: {
        $type: "string",
        $regex: `^${legacyOwner}`,
      },
    });

    owners.forEach((owner) => found.add(owner));
  }

  return [...found];
};

try {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const user = await db.collection("users").findOne({ email });

  if (!user?._id) {
    throw new Error(`No user found for ${email}`);
  }

  const currentOwnerId = String(user._id);
  const legacyOwnerIds = await findLegacyOwnerIds(db);

  if (!legacyOwnerIds.length) {
    throw new Error(`No legacy owner found for "${legacyOwner}"`);
  }

  console.log("targetUser", email, mask(currentOwnerId));
  console.log("legacyOwners", legacyOwnerIds.map(mask));
  console.log("mode", shouldApply ? "apply" : "dry-run");

  for (const collection of collections) {
    const exists = await db.listCollections({ name: collection }).hasNext();
    if (!exists) continue;

    const filter = { ownerId: { $in: legacyOwnerIds } };
    const count = await db.collection(collection).countDocuments(filter);

    if (!count) {
      console.log(collection, "0 records");
      continue;
    }

    if (shouldApply) {
      const result = await db.collection(collection).updateMany(filter, {
        $set: { ownerId: currentOwnerId },
      });
      console.log(collection, `${result.modifiedCount} moved`);
    } else {
      console.log(collection, `${count} would move`);
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
