import React, { useEffect, useMemo, useState } from "react";
import BackButton from "./BackButton";
import ProfileMenu from "./ProfileMenu";
import { apiFetch } from "../utils/api";
import { normalizeEmail, normalizeNameKey, normalizePhone } from "../utils/validation";

const Customers = () => {
  const [sales, setSales] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const res = await apiFetch("/sale");
        if (!res.ok) {
          throw new Error("Failed to load sales");
        }
        const data = await res.json();
        setSales(data);
      } catch (err) {
        setErrorMessage("Unable to load customers.");
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  const customers = useMemo(() => {
    const map = new Map();
    sales.forEach((sale) => {
      const name = sale.customerName || "Unknown Customer";
      const phone = sale.customerPhone || "";
      const email = sale.customerEmail || "";
      const key = [normalizeNameKey(name), normalizePhone(phone), normalizeEmail(email)]
        .filter(Boolean)
        .join("|") || sale._id;

      const amount = Number(sale.price || 0) * Number(sale.quantity || 0);
      const dateValue = sale.saleDate || sale.date;

      if (!map.has(key)) {
        map.set(key, {
          name,
          phone: normalizePhone(phone) || phone,
          email: normalizeEmail(email) || email,
          address: sale.customerAddress || "",
          totalAmount: 0,
          totalQuantity: 0,
          lastDate: dateValue,
          invoices: new Set(),
        });
      }

      const entry = map.get(key);
      entry.totalAmount += amount;
      entry.totalQuantity += Number(sale.quantity || 0);
      if (sale.invoiceNumber) {
        entry.invoices.add(sale.invoiceNumber);
      }
      if (dateValue && new Date(dateValue) > new Date(entry.lastDate || 0)) {
        entry.lastDate = dateValue;
      }
      if (!entry.address && sale.customerAddress) {
        entry.address = sale.customerAddress;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [sales]);

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.email, customer.address]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q))
    );
  }, [query, customers]);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  const csvEscape = (value) => {
    const safe = value === null || value === undefined ? "" : String(value);
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const downloadCSV = () => {
    if (!customers.length) return alert("No customers to download");

    const headers = [
      "Customer Name",
      "Phone",
      "Email",
      "Address",
      "Total Amount",
      "Total Quantity",
      "Last Sale Date",
      "Invoices",
    ];

    const rows = customers.map((customer) => [
      customer.name,
      customer.phone,
      customer.email,
      customer.address,
      customer.totalAmount,
      customer.totalQuantity,
      formatDate(customer.lastDate),
      Array.from(customer.invoices).join(" | "),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `customers_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page full fill">
      <div className="topbar">
        <BackButton />
        <ProfileMenu />
      </div>
      <div className="page-header">
        <div>
          <p className="kicker">Customers</p>
          <h1>Customer Directory</h1>
          <p className="subtitle">Keep your top customers close.</p>
        </div>
        <div className="row">
          <input
            className="input"
            placeholder="Search customer"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn ghost" onClick={downloadCSV}>Download CSV</button>
        </div>
      </div>

      <div className="card scroll-card">
        <div className="card-header">
          <h2>Customers</h2>
          <span className="badge">{filteredCustomers.length} records</span>
        </div>

      {loading ? (
          <p className="subtitle">Loading customers...</p>
        ) : errorMessage ? (
          <p className="subtitle">{errorMessage}</p>
        ) : filteredCustomers.length === 0 ? (
          <p className="subtitle">No customers found</p>
        ) : (
          <div className="stack scroll-panel">
            {filteredCustomers.map((customer, index) => (
              <div key={`${customer.name}-${index}`} className="card" style={{ padding: 14 }}>
                <div className="stack sm">
                  <strong>{customer.name}</strong>
                  <p className="subtitle">Phone: {customer.phone || "-"}</p>
                  <p className="subtitle">Email: {customer.email || "-"}</p>
                  <p className="subtitle">Address: {customer.address || "-"}</p>
                  <p className="subtitle">Total Spent: ₹{customer.totalAmount.toLocaleString()}</p>
                  <p className="subtitle">Invoices: {Array.from(customer.invoices).join(", ") || "-"}</p>
                  <p className="subtitle">Last Sale: {formatDate(customer.lastDate)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;
