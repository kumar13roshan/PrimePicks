import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import BackButton from "./BackButton";
import ProfileMenu from "./ProfileMenu";
import { apiFetch } from "../utils/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState({
    revenue: 0,
    cost: 0,
    net: 0,
    todayRevenue: 0,
    todayCost: 0,
    todayNet: 0,
  });
  const [stockSummary, setStockSummary] = useState({ total: 0, low: 0, out: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const toDateKey = (value) => {
      if (!value) return null;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const getLast7Days = () => {
      const days = [];
      const today = new Date();
      for (let i = 6; i >= 0; i -= 1) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push(d);
      }
      return days;
    };

    const fetchStats = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const [salesRes, purchasesRes, stockRes] = await Promise.all([
          apiFetch("/sale"),
          apiFetch("/purchase"),
          apiFetch("/stock"),
        ]);

        if (!salesRes.ok || !purchasesRes.ok || !stockRes.ok) {
          throw new Error("Failed to load dashboard data");
        }

        const [sales, purchases, stock] = await Promise.all([
          salesRes.json(),
          purchasesRes.json(),
          stockRes.json(),
        ]);

        const revenueByDay = {};
        const costByDay = {};

        sales.forEach((sale) => {
          const key = toDateKey(sale.saleDate || sale.date);
          if (!key) return;
          const amount = Number(sale.price || 0) * Number(sale.quantity || 0);
          revenueByDay[key] = (revenueByDay[key] || 0) + amount;
        });

        purchases.forEach((purchase) => {
          const key = toDateKey(purchase.purchaseDate || purchase.date);
          if (!key) return;
          const amount = Number(purchase.price || 0) * Number(purchase.quantity || 0);
          costByDay[key] = (costByDay[key] || 0) + amount;
        });

        const last7Days = getLast7Days();
        const todayKey = toDateKey(new Date());
        const todayRevenue = revenueByDay[todayKey] || 0;
        const todayCost = costByDay[todayKey] || 0;
        let totalRevenue = 0;
        let totalCost = 0;

        const data = last7Days.map((day) => {
          const key = toDateKey(day);
          const revenue = revenueByDay[key] || 0;
          const cost = costByDay[key] || 0;
          totalRevenue += revenue;
          totalCost += cost;
          const net = revenue - cost;
          return {
            name: day.toLocaleDateString(undefined, { weekday: "short" }),
            profit: net > 0 ? net : 0,
            loss: net < 0 ? Math.abs(net) : 0,
          };
        });

        setChartData(data);
        setSummary({
          revenue: totalRevenue,
          cost: totalCost,
          net: totalRevenue - totalCost,
          todayRevenue,
          todayCost,
          todayNet: todayRevenue - todayCost,
        });

        const lowStock = stock.filter((item) => item.quantity > 0 && item.quantity <= 5).length;
        const outOfStock = stock.filter((item) => item.quantity === 0).length;
        setStockSummary({
          total: stock.length,
          low: lowStock,
          out: outOfStock,
        });
      } catch (error) {
        setErrorMessage("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;

  return (
    <div className="page full">
      <BackButton />
      <div className="topbar">
        <div>
          <p className="kicker">Dashboard</p>
          <h1>PrimePicks in a glance</h1>
          <p className="subtitle">A calm, clear view of what matters today.</p>
        </div>
        <ProfileMenu />
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-label">Today Sales</p>
          <div className="stat-value good">{formatCurrency(summary.todayRevenue)}</div>
          <p className="subtitle">Revenue today</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Today Purchases</p>
          <div className="stat-value warn">{formatCurrency(summary.todayCost)}</div>
          <p className="subtitle">Cost today</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Today Net</p>
          <div className={`stat-value ${summary.todayNet >= 0 ? "good" : "danger"}`}>
            {formatCurrency(summary.todayNet)}
          </div>
          <p className="subtitle">Profit after costs</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Low Stock</p>
          <div className={`stat-value ${stockSummary.low > 0 ? "warn" : "good"}`}>
            {stockSummary.low}
          </div>
          <p className="subtitle">Items below 5</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Out of Stock</p>
          <div className={`stat-value ${stockSummary.out > 0 ? "danger" : "good"}`}>
            {stockSummary.out}
          </div>
          <p className="subtitle">Need reorder</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <div className="card-header">
          <h2>Quick Actions</h2>
          <span className="badge">Fast navigation</span>
        </div>
        <div className="action-grid">
          <button type="button" className="action-card" onClick={() => navigate("/purchase")}>
            <img src="https://img.icons8.com/ios-filled/50/000000/shopping-cart.png" alt="Purchase" />
            <div>
              <h3>Purchase</h3>
              <p className="subtitle">Log incoming inventory fast.</p>
            </div>
          </button>
          <button type="button" className="action-card" onClick={() => navigate("/sale")}>
            <img src="https://img.icons8.com/ios-filled/50/000000/sell.png" alt="Sale" />
            <div>
              <h3>Sales</h3>
              <p className="subtitle">Ring up sales in seconds.</p>
            </div>
          </button>
          <button type="button" className="action-card" onClick={() => navigate("/stock")}>
            <img src="https://img.icons8.com/ios-filled/50/000000/box.png" alt="Stock" />
            <div>
              <h3>Stock</h3>
              <p className="subtitle">Spot low inventory early.</p>
            </div>
          </button>
          <button type="button" className="action-card" onClick={() => navigate("/transaction")}>
            <img src="https://img.icons8.com/ios-filled/50/000000/money-transfer.png" alt="Transactions" />
            <div>
              <h3>Transactions</h3>
              <p className="subtitle">Review cash and online flows.</p>
            </div>
          </button>
          <button type="button" className="action-card" onClick={() => navigate("/suppliers")}>
            <img src="https://img.icons8.com/ios-filled/50/000000/factory.png" alt="Suppliers" />
            <div>
              <h3>Suppliers</h3>
              <p className="subtitle">Manage vendor relationships.</p>
            </div>
          </button>
          <button type="button" className="action-card" onClick={() => navigate("/customers")}>
            <img src="https://img.icons8.com/ios-filled/50/000000/conference.png" alt="Customers" />
            <div>
              <h3>Customers</h3>
              <p className="subtitle">Know your repeat buyers.</p>
            </div>
          </button>
        </div>
      </div>

      <div className="card glow">
        <div className="card-header">
          <div>
            <h2>Profit & Loss Overview</h2>
            <p className="subtitle">Weekly snapshot of performance.</p>
          </div>
          <div className="row">
            <span className="badge accent">Net: {formatCurrency(summary.net)}</span>
            <span className="badge">Revenue: {formatCurrency(summary.revenue)}</span>
            <span className="badge">Cost: {formatCurrency(summary.cost)}</span>
            <span className="badge">Low Stock: {stockSummary.low}</span>
            <span className="badge">Out of Stock: {stockSummary.out}</span>
          </div>
        </div>
        {errorMessage ? (
          <p className="subtitle">{errorMessage}</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="var(--muted)" />
              <YAxis stroke="var(--muted)" />
              <Tooltip
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--ink)",
                }}
                labelStyle={{ color: "var(--ink)" }}
                formatter={(value, name) => [
                  formatCurrency(value),
                  name === "profit" ? "Profit" : "Loss",
                  name === "profit" ? "Profit" : "Loss",
                ]}
              />
              <Bar dataKey="profit" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="loss" fill="var(--accent)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {loading && !errorMessage && <p className="subtitle">Loading chart...</p>}
      </div>
    </div>
  );
};

export default Dashboard;
