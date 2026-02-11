import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
dotenv.config();


import purchaseRoutes from "./routes/purchase.js";
import saleRoutes from "./routes/sale.js";
import stockRoutes from "./routes/stock.js";
import transactionRoutes from "./routes/transaction.js";
import adminRoutes from "./routes/admin.js";
import requireAuth from "./middleware/requireAuth.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

connectDB();

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", requireAuth);
app.use("/api", purchaseRoutes);
app.use("/api", saleRoutes);
app.use("/api", stockRoutes);
app.use("/api", transactionRoutes);
app.use("/api", adminRoutes);

app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
