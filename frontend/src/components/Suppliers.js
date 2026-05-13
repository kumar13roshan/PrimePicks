import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../utils/api";
import { normalizeEmail, normalizeNameKey, normalizePhone } from "../utils/validation";

const Suppliers = () => {
  const [purchases, setPurchases] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingKey, setDeletingKey] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchPurchases = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await apiFetch("/purchase");
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

  useEffect(() => {
    fetchPurchases();
  }, []);

  const suppliers = useMemo(() => {
    const map = new Map();
    purchases.forEach((purchase) => {
      const name = purchase.supplierName || "Unknown Supplier";
      const phone = purchase.supplierPhone || "";
      const email = purchase.supplierEmail || "";
      const key =
        [normalizeNameKey(name), normalizePhone(phone), normalizeEmail(email)].filter(Boolean).join("|") ||
        purchase._id;

      const amount = Number(purchase.price || 0) * Number(purchase.quantity || 0);
      const dateValue = purchase.purchaseDate || purchase.date;

      if (!map.has(key)) {
        map.set(key, {
          key,
          name,
          phone: normalizePhone(phone) || phone,
          email: normalizeEmail(email) || email,
          address: purchase.supplierAddress || "",
          totalAmount: 0,
          totalQuantity: 0,
          lastDate: dateValue,
          items: new Set(),
          purchases: [],
          purchaseIds: [],
        });
      }

      const entry = map.get(key);
      entry.totalAmount += amount;
      entry.totalQuantity += Number(purchase.quantity || 0);
      entry.items.add(purchase.itemName || "Item");
      if (purchase._id) {
        entry.purchaseIds.push(purchase._id);
      }
      entry.purchases.push({
        itemName: purchase.itemName || "-",
        quantity: Number(purchase.quantity || 0),
        unit: purchase.unit || "pcs",
        price: Number(purchase.price || 0),
        amount,
        invoiceNumber: purchase.invoiceNumber || "-",
        purchaseDate: dateValue,
        notes: purchase.notes || "",
      });
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

  const totals = useMemo(
    () =>
      filteredSuppliers.reduce(
        (summary, supplier) => ({
          totalAmount: summary.totalAmount + supplier.totalAmount,
          totalQuantity: summary.totalQuantity + supplier.totalQuantity,
          itemCount: summary.itemCount + supplier.items.size,
        }),
        { totalAmount: 0, totalQuantity: 0, itemCount: 0 }
      ),
    [filteredSuppliers]
  );

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
      "Purchase Details",
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
      supplier.purchases
        .map(
          (purchase) =>
            `${purchase.itemName} - ${purchase.quantity} ${purchase.unit} x Rs ${purchase.price} = Rs ${purchase.amount}, Invoice: ${purchase.invoiceNumber}, Date: ${formatDate(purchase.purchaseDate)}${purchase.notes ? `, Notes: ${purchase.notes}` : ""}`
        )
        .join(" | "),
    ]);

    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

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

  const deleteSupplier = async (supplier) => {
    if (!window.confirm(`Delete ${supplier.name} and all related purchase details?`)) {
      return;
    }

    setDeletingKey(supplier.key);
    try {
      for (const id of supplier.purchaseIds) {
        const res = await apiFetch(`/purchase/${id}`, { method: "DELETE" });
        let data = {};
        try {
          data = await res.json();
        } catch (err) {
          data = {};
        }
        if (!res.ok) {
          throw new Error(data.message || "Failed to delete supplier purchases");
        }
      }
      await fetchPurchases();
    } catch (err) {
      alert(err.message || "Failed to delete supplier.");
    } finally {
      setDeletingKey("");
    }
  };

  return (
    <div className="page full fill">
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
          <button className="btn ghost" onClick={downloadCSV}>
            Download CSV
          </button>
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
          <div className="scroll-panel">
            <table className="table sheet-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Supplier Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Total Spent</th>
                  <th>Total Qty</th>
                  <th>Items</th>
                  <th>Purchase Details</th>
                  <th>Last Purchase</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier, index) => (
                  <tr key={`${supplier.name}-${supplier.phone}-${index}`}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{supplier.name}</strong>
                    </td>
                    <td>{supplier.phone || "-"}</td>
                    <td>{supplier.email || "-"}</td>
                    <td>{supplier.address || "-"}</td>
                    <td>Rs {supplier.totalAmount.toLocaleString()}</td>
                    <td>{supplier.totalQuantity.toLocaleString()}</td>
                    <td>{Array.from(supplier.items).join(", ")}</td>
                    <td>
                      <div className="supplier-purchase-details">
                        {supplier.purchases.map((purchase, purchaseIndex) => (
                          <div key={`${purchase.itemName}-${purchase.invoiceNumber}-${purchaseIndex}`}>
                            <strong>{purchase.itemName}</strong>
                            <span>
                              {purchase.quantity} {purchase.unit} x Rs {purchase.price.toLocaleString()} = Rs{" "}
                              {purchase.amount.toLocaleString()}
                            </span>
                            <span>
                              Invoice: {purchase.invoiceNumber} | Date: {formatDate(purchase.purchaseDate)}
                            </span>
                            {purchase.notes && <span>Notes: {purchase.notes}</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>{formatDate(supplier.lastDate)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn danger"
                        onClick={() => deleteSupplier(supplier)}
                        disabled={deletingKey === supplier.key}
                      >
                        {deletingKey === supplier.key ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td></td>
                  <td>
                    <strong>Total</strong>
                  </td>
                  <td colSpan="3">{filteredSuppliers.length} suppliers</td>
                  <td>
                    <strong>Rs {totals.totalAmount.toLocaleString()}</strong>
                  </td>
                  <td>
                    <strong>{totals.totalQuantity.toLocaleString()}</strong>
                  </td>
                  <td>{totals.itemCount} item links</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Suppliers;
