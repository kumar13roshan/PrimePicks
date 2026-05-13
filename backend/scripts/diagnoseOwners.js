import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ quiet: true });

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/diagnoseOwners.js <email>");
  process.exit(1);
}

const mask = (value) => {
  const text = String(value || "");
  return text.length > 10 ? `${text.slice(0, 6)}...${text.slice(-4)}` : text;
};

const collections = ["users", "purchases", "sales", "stocks", "transactions", "openingbalances", "admin"];

try {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const user = await db.collection("users").findOne({ email: email.trim().toLowerCase() });

  console.log("currentUserId", mask(user?._id));

  for (const name of collections) {
    const exists = await db.listCollections({ name }).hasNext();
    if (!exists) {
      console.log(name, "missing");
      continue;
    }

    const total = await db.collection(name).countDocuments({});
    const owners = await db
      .collection(name)
      .aggregate([
        { $group: { _id: "$ownerId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    console.log(
      name,
      "total",
      total,
      "owners",
      owners.map((owner) => ({ owner: mask(owner._id), count: owner.count }))
    );

    if (["purchases", "sales", "stocks"].includes(name)) {
      const samples = await db
        .collection(name)
        .aggregate([
          {
            $group: {
              _id: "$ownerId",
              count: { $sum: 1 },
              items: { $addToSet: "$itemName" },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ])
        .toArray();

      console.log(
        `${name} samples`,
        samples.map((sample) => ({
          owner: mask(sample._id),
          count: sample.count,
          items: sample.items.filter(Boolean).slice(0, 5),
        }))
      );
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
