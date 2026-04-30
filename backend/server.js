import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
dotenv.config({ quiet: true });


import purchaseRoutes from "./routes/purchase.js";
import saleRoutes from "./routes/sale.js";
import stockRoutes from "./routes/stock.js";
import transactionRoutes from "./routes/transaction.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import requireAuth from "./middleware/requireAuth.js";

const app = express();
const DEFAULT_PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

connectDB();

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});


app.use("/api", authRoutes);
>>>>>>> c5d8d4a (Updated PrimePicks: Firebase removed, JWT added)
app.use("/api", requireAuth);

app.use("/api", adminRoutes);
app.use("/api", purchaseRoutes);
app.use("/api", saleRoutes);
app.use("/api", stockRoutes);
app.use("/api", transactionRoutes);

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Backend running at http://localhost:${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use. Retrying on ${nextPort}...`);
      startServer(nextPort);
      return;
    }

    throw error;
  });
};

startServer(DEFAULT_PORT);
