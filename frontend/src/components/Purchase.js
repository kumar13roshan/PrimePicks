import React, { useState, useEffect, useCallback } from "react";
import BackButton from "./BackButton";
import ProfileMenu from "./ProfileMenu";
import { apiFetch } from "../utils/api";

const initialDate = new Date().toISOString().slice(0, 10);
const unitOptions = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "L", label: "Liters (L)" },
  { value: "kg", label: "Kilograms (kg)" },
];

const PurchaseEntry = () => {
  const [form, setForm] = useState({
    itemName: '',
    itemPrice: '',
    quantity: '',
    unit: 'pcs',
    supplierName: '',
    supplierPhone: '',
    supplierGstNumber: '',
    supplierEmail: '',
    supplierAddress: '',
    invoiceNumber: '',
    purchaseDate: initialDate,
    notes: '',
  });

  const [purchases, setPurchases] = useState([]);

  const loadPurchases = useCallback(async () => {
    try {
      const res = await apiFetch("/purchase");
      if (!res.ok) {
        throw new Error("Failed to load purchases");
      }
      const data = await res.json();
      setPurchases(data);
    } catch (err) {
      console.log("Error fetching purchases:", err);
    }
  }, []);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  const handleAddPurchase = async () => {
    if (!form.itemName || !form.itemPrice || !form.quantity || !form.unit || !form.supplierName || !form.supplierPhone || !form.purchaseDate) {
      return alert("Fill all required fields");
    }

    try {
      const res = await apiFetch("/purchase", {
        method: "POST",
        body: JSON.stringify({
          itemName: form.itemName,
          price: Number(form.itemPrice),
          quantity: Number(form.quantity),
          unit: form.unit,
          supplierName: form.supplierName,
          supplierPhone: form.supplierPhone,
          supplierGstNumber: form.supplierGstNumber,
          supplierEmail: form.supplierEmail,
          supplierAddress: form.supplierAddress,
          invoiceNumber: form.invoiceNumber,
          purchaseDate: form.purchaseDate,
          notes: form.notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return alert(data.message || "Failed to add purchase");
      }

      await loadPurchases();
      setForm({
        itemName: '',
        itemPrice: '',
        quantity: '',
        unit: 'pcs',
        supplierName: '',
        supplierPhone: '',
        supplierGstNumber: '',
        supplierEmail: '',
        supplierAddress: '',
        invoiceNumber: '',
        purchaseDate: initialDate,
        notes: '',
      });
    } catch (err) {
      alert("Unable to reach the backend. Check that the server is running and the API URL is correct.");
    }
  };

  const deletePurchase = async (id) => {
    try {
      const res = await apiFetch(`/purchase/${id}`, { method: "DELETE" });
      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        data = {};
      }
      if (!res.ok) {
        return alert(data.message || "Failed to delete purchase");
      }
      await loadPurchases();
    } catch (err) {
      alert("Unable to reach the backend. Check that the server is running.");
    }
  };

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
    if (!purchases.length) return alert("No purchases to download");

    const headers = [
      "Item Name",
      "Quantity",
      "Unit",
      "Price",
      "Supplier Name",
      "Supplier Phone",
      "Supplier GST Number",
      "Supplier Email",
      "Supplier Address",
      "Invoice Number",
      "Purchase Date",
      "Notes",
      "Record Created",
    ];

    const rows = purchases.map((p) => [
      p.itemName,
      p.quantity,
      p.unit || "pcs",
      p.price,
      p.supplierName,
      p.supplierPhone,
      p.supplierGstNumber,
      p.supplierEmail,
      p.supplierAddress,
      p.invoiceNumber,
      formatDate(p.purchaseDate || p.date),
      p.notes,
      formatDate(p.date),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `purchases_${new Date().toISOString().slice(0, 10)}.csv`;
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
          <p className="kicker">Purchases</p>
          <h1>Record new inventory</h1>
          <p className="subtitle">Capture supplier details, quantities, and dates in one place.</p>
        </div>
        <div className="row">
          <span className="badge accent">{purchases.length} total entries</span>
          <button className="btn ghost" onClick={downloadCSV}>Download CSV</button>
        </div>
      </div>

      <div className="grid two">
        <div className="card glow stack">
          <div className="card-header">
            <div>
              <h2>New Purchase</h2>
              <p className="subtitle">Minimal steps. Maximum clarity.</p>
            </div>
            <span className="badge">Required *</span>
          </div>
          <div className="stepper">
            <span className="step active">1 Supplier</span>
            <span className="step active">2 Item</span>
            <span className="step active">3 Invoice</span>
          </div>
          <div className="stack">
            <span className="section-label">Supplier Details</span>
            <input
              placeholder="Supplier Name *"
              value={form.supplierName}
              onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
              className="input"
            />
            <div className="row">
              <input
                placeholder="Supplier Phone *"
                value={form.supplierPhone}
                onChange={(e) => setForm({ ...form, supplierPhone: e.target.value })}
                className="input"
              />
              <input
                placeholder="Supplier GST Number"
                value={form.supplierGstNumber}
                onChange={(e) => setForm({ ...form, supplierGstNumber: e.target.value })}
                className="input"
              />
            </div>
            <input
              placeholder="Supplier Email"
              type="email"
              value={form.supplierEmail}
              onChange={(e) => setForm({ ...form, supplierEmail: e.target.value })}
              className="input"
            />
            <input
              placeholder="Supplier Address"
              value={form.supplierAddress}
              onChange={(e) => setForm({ ...form, supplierAddress: e.target.value })}
              className="input"
            />

            <span className="section-label">Item Details</span>
            <input
              placeholder="Item Name *"
              value={form.itemName}
              onChange={(e) => setForm({ ...form, itemName: e.target.value })}
              className="input"
            />
            <div className="row">
              <input
                placeholder="Item Price *"
                type="number"
                value={form.itemPrice}
                onChange={(e) => setForm({ ...form, itemPrice: e.target.value })}
                className="input"
              />
              <input
                placeholder="Quantity *"
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="input"
              />
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="select"
              >
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <span className="section-label">Invoice & Notes</span>
            <div className="row">
              <input
                placeholder="Invoice Number"
                value={form.invoiceNumber}
                onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                className="input"
              />
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="input"
              />
            </div>
            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input"
              rows={3}
            />
            <button onClick={handleAddPurchase} className="btn primary">Add Purchase</button>
          </div>
        </div>

        <div className="card scroll-card">
          <div className="card-header">
            <h2>Purchase List</h2>
            <span className="badge">Latest first</span>
          </div>
          {purchases.length === 0 ? (
            <p className="subtitle">No purchases found</p>
          ) : (
            <div className="stack scroll-panel">
              {purchases.map((p) => (
                <div key={p._id} className="card" style={{ padding: 14 }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div className="stack sm">
                      <strong>{p.itemName}</strong>
                      <p className="subtitle">{p.quantity} {p.unit || "pcs"} · ₹{p.price}</p>
                      <p className="subtitle">
                        Supplier: {([p.supplierName, p.supplierPhone].filter(Boolean).join(" · ")) || "-"}
                      </p>
                      {p.supplierGstNumber && <p className="subtitle">GST: {p.supplierGstNumber}</p>}
                      {p.supplierEmail && <p className="subtitle">Email: {p.supplierEmail}</p>}
                      {p.supplierAddress && <p className="subtitle">Address: {p.supplierAddress}</p>}
                      {p.invoiceNumber && <p className="subtitle">Invoice: {p.invoiceNumber}</p>}
                      <p className="subtitle">Purchase Date: {formatDate(p.purchaseDate || p.date)}</p>
                      {p.notes && <p className="subtitle">Notes: {p.notes}</p>}
                    </div>
                    <button
                      onClick={() => deletePurchase(p._id)}
                      className="btn danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseEntry;
