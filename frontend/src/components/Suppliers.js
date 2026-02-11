import React, { useEffect, useMemo, useState } from "react";
import BackButton from "./BackButton";
import ProfileMenu from "./ProfileMenu";

const API = process.env.REACT_APP_API_URL || "/api";

const Suppliers = () => {
  const [purchases, setPurchases] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const res = await fetch(`${API}/purchase`);
        if (!res.ok) {
          throw new Error("Failed to load purchases");
        }
        const data = await res.json();
        setPurchases(data);
      } catch (err) {
        setErrorMessage("Unable to load suppliers.");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  const suppliers = useMemo(() => {
    const map = new Map();
    purchases.forEach((purchase) => {
      const name = purchase.supplierName || "Unknown Supplier";
      const phone = purchase.supplierPhone || "";
      const email = purchase.supplierEmail || "";
      const key = [name, phone, email].filter(Boolean).join("|") || purchase._id;

      const amount = Number(purchase.price || 0) * Number(purchase.quantity || 0);
      const dateValue = purchase.purchaseDate || purchase.date;

      if (!map.has(key)) {
        map.set(key, {
          name,
          phone,
          email,
          address: purchase.supplierAddress || "",
          totalAmount: 0,
          totalQuantity: 0,
          lastDate: dateValue,
          items: new Set(),
        });
      }

      const entry = map.get(key);
      entry.totalAmount += amount;
      entry.totalQuantity += Number(purchase.quantity || 0);
      entry.items.add(purchase.itemName || "Item");
      if (dateValue && new Date(dateValue) > new Date(entry.lastDate || 0)) {
        entry.lastDate = dateValue;
      }
      if (!entry.address && purchase.supplierAddress) {
        entry.address = purchase.supplierAddress;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [purchases]);

  const filteredSuppliers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((supplier) =>
      [supplier.name, supplier.phone, supplier.email, supplier.address]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q))
    );
  }, [query, suppliers]);

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
    if (!suppliers.length) return alert("No suppliers to download");

    const headers = [
      "Supplier Name",
      "Phone",
      "Email",
      "Address",
      "Total Amount",
      "Total Quantity",
      "Last Purchase Date",
      "Items",
    ];

    const rows = suppliers.map((supplier) => [
      supplier.name,
      supplier.phone,
      supplier.email,
      supplier.address,
      supplier.totalAmount,
      supplier.totalQuantity,
      formatDate(supplier.lastDate),
      Array.from(supplier.items).join(" | "),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `suppliers_${new Date().toISOString().slice(0, 10)}.csv`;
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
          <p className="kicker">Suppliers</p>
          <h1>Supplier Directory</h1>
          <p className="subtitle">Your trusted vendors, ranked by spend.</p>
        </div>
        <div className="row">
          <input
            className="input"
            placeholder="Search supplier"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn ghost" onClick={downloadCSV}>Download CSV</button>
        </div>
      </div>

      <div className="card scroll-card">
        <div className="card-header">
          <h2>Suppliers</h2>
          <span className="badge">{filteredSuppliers.length} records</span>
        </div>

        {loading ? (
          <p className="subtitle">Loading suppliers...</p>
        ) : errorMessage ? (
          <p className="subtitle">{errorMessage}</p>
        ) : filteredSuppliers.length === 0 ? (
          <p className="subtitle">No suppliers found</p>
        ) : (
          <div className="stack scroll-panel">
            {filteredSuppliers.map((supplier, index) => (
              <div key={`${supplier.name}-${index}`} className="card" style={{ padding: 14 }}>
                <div className="stack sm">
                  <strong>{supplier.name}</strong>
                  <p className="subtitle">Phone: {supplier.phone || "-"}</p>
                  <p className="subtitle">Email: {supplier.email || "-"}</p>
                  <p className="subtitle">Address: {supplier.address || "-"}</p>
                  <p className="subtitle">Total Spent: ₹{supplier.totalAmount.toLocaleString()}</p>
                  <p className="subtitle">Items: {Array.from(supplier.items).join(", ")}</p>
                  <p className="subtitle">Last Purchase: {formatDate(supplier.lastDate)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Suppliers;
