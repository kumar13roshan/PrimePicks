import mongoose from "mongoose";

const connectDB = async () => {
  const uri =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/primepicks";

  try {
    await mongoose.connect(uri);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};

export default connectDB;
