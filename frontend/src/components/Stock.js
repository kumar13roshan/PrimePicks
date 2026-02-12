import React, { useState, useEffect, useMemo, useCallback } from "react";
import BackButton from "./BackButton";
import ProfileMenu from "./ProfileMenu";
import { apiFetch } from "../utils/api";

const unitOptions = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "L", label: "Liters (L)" },
  { value: "kg", label: "Kilograms (kg)" },
];

const StockApp = () => {
  const [stock, setStock] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [openingItemKey, setOpeningItemKey] = useState("");
  const [openingForm, setOpeningForm] = useState({
    itemName: "",
    openingQuantity: "",
    unit: "pcs",
    price: "",
  });
  const [openingSaving, setOpeningSaving] = useState(false);
  const [openingMessage, setOpeningMessage] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [stockRes, purchaseRes, saleRes] = await Promise.all([
        apiFetch("/stock"),
        apiFetch("/purchase"),
        apiFetch("/sale"),
      ]);

      if (!stockRes.ok || !purchaseRes.ok || !saleRes.ok) {
        throw new Error("Failed to load inventory data");
      }

      const [stockData, purchaseData, saleData] = await Promise.all([
        stockRes.json(),
        purchaseRes.json(),
        saleRes.json(),
      ]);

      setStock(stockData);
      setPurchases(purchaseData);
      setSales(saleData);
    } catch (err) {
      setErrorMessage("Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);

    return () => clearInterval(interval);
  }, [fetchAll]);

  const lowStock = stock.filter((item) => item.quantity > 0 && item.quantity <= 5);
  const outOfStock = stock.filter((item) => item.quantity === 0);
  const totalUnits = useMemo(
    () => stock.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [stock]
  );

  const reorderList = useMemo(() => {
    return [...outOfStock, ...lowStock]
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 6);
  }, [lowStock, outOfStock]);

  const movements = useMemo(() => {
    const activity = [
      ...purchases.map((purchase) => ({
        type: "Purchase",
        itemName: purchase.itemName,
        quantity: purchase.quantity,
        unit: purchase.unit,
        date: purchase.purchaseDate || purchase.date,
      })),
      ...sales.map((sale) => ({
        type: "Sale",
        itemName: sale.itemName,
        quantity: sale.quantity,
        unit: sale.unit,
        date: sale.saleDate || sale.date,
      })),
    ];

    return activity
      .filter((entry) => entry.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);
  }, [purchases, sales]);

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const handleOpeningSelect = (value) => {
    setOpeningMessage("");
    setOpeningItemKey(value);

    if (value === "__new__") {
      setOpeningForm({
        itemName: "",
        openingQuantity: "",
        unit: "pcs",
        price: "",
      });
      return;
    }

    const matched = stock.find((item) => item.itemName === value);
    if (matched) {
      setOpeningForm({
        itemName: matched.itemName,
        openingQuantity: String(matched.openingQuantity ?? 0),
        unit: matched.unit || "pcs",
        price: matched.price ?? "",
      });
      return;
    }

    setOpeningForm({
      itemName: value || "",
      openingQuantity: "",
      unit: "pcs",
      price: "",
    });
  };

  const saveOpeningStock = async () => {
    const name = String(openingForm.itemName || "").trim();
    const openingQty = Number(openingForm.openingQuantity);

    if (!name) {
      return alert("Enter an item name.");
    }
    if (!Number.isFinite(openingQty) || openingQty < 0) {
      return alert("Opening quantity must be 0 or more.");
    }

    const payload = {
      itemName: name,
      openingQuantity: openingQty,
      unit: openingForm.unit || "pcs",
    };

    if (openingForm.price !== "") {
      const unitPrice = Number(openingForm.price);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return alert("Price must be 0 or more.");
      }
      payload.price = unitPrice;
    } else if (openingItemKey === "__new__") {
      return alert("Price is required for new items.");
    }

    setOpeningSaving(true);
    setOpeningMessage("");
    try {
      const res = await apiFetch("/stock/opening", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return alert(data.message || "Failed to save opening stock");
      }
      await fetchAll();
      setOpeningMessage("Opening stock saved.");
      if (openingItemKey === "__new__") {
        setOpeningForm({
          itemName: "",
          openingQuantity: "",
          unit: "pcs",
          price: "",
        });
      }
    } catch (err) {
      alert("Unable to reach the backend. Check that the server is running.");
    } finally {
      setOpeningSaving(false);
    }
  };

  const deleteStockItem = async (item) => {
    const id = item?._id || item?.id || item?.itemName;
    if (!id) {
      alert("Missing stock item id.");
      return;
    }

    const confirmed = window.confirm("Delete this stock item? This cannot be undone.");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await apiFetch(`/stock/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        return alert(data.message || "Failed to delete stock item");
      }
      setStock((prev) =>
        prev.filter(
          (entry) => entry._id !== id && entry.id !== id && entry.itemName !== id
        )
      );
      await fetchAll();
    } catch (err) {
      alert("Unable to reach the backend. Check that the server is running.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="page full fill">
      <div className="topbar">
        <BackButton />
        <ProfileMenu />
      </div>
      <div className="page-header">
        <div>
          <p className="kicker">Inventory</p>
          <h1>Stock Manager</h1>
          <p className="subtitle">Monitor live quantities and restock before you run out.</p>
        </div>
        <div className="row">
          <span className="badge accent">{stock.length} products</span>
          <span className="badge">Total units: {totalUnits}</span>
        </div>
      </div>

      <div className="grid two">
        <div className="column">
          <div className="card glow stack">
            <div className="card-header">
              <h2>Inventory Health</h2>
              <span className="badge">Live status</span>
            </div>
            <div className="row">
              <span className="tag good">In Stock: {stock.length - lowStock.length - outOfStock.length}</span>
              <span className="tag warn">Low Stock: {lowStock.length}</span>
              <span className="tag danger">Out of Stock: {outOfStock.length}</span>
            </div>
            <p className="subtitle">
              Items below 5 units are flagged for reorder. Out of stock items need immediate action.
            </p>
          </div>

          <div className="card stack">
            <div className="card-header">
              <div>
                <h2>Opening Stock</h2>
                <p className="subtitle">Add starting quantities for items already on hand.</p>
              </div>
              <span className="badge">Start-up</span>
            </div>
            <div className="stack">
              <div className="field">
                <span>Item</span>
                <select
                  className="select"
                  value={openingItemKey}
                  onChange={(e) => handleOpeningSelect(e.target.value)}
                >
                  <option value="">Select item</option>
                  {stock.map((item) => (
                    <option key={item._id || item.itemName} value={item.itemName}>
                      {item.itemName}
                    </option>
                  ))}
                  <option value="__new__">+ New item</option>
                </select>
              </div>

              {openingItemKey === "__new__" && (
                <input
                  placeholder="New Item Name"
                  value={openingForm.itemName}
                  onChange={(e) => setOpeningForm({ ...openingForm, itemName: e.target.value })}
                  className="input"
                />
              )}

              <div className="row">
                <input
                  placeholder="Opening Quantity"
                  type="number"
                  value={openingForm.openingQuantity}
                  onChange={(e) => setOpeningForm({ ...openingForm, openingQuantity: e.target.value })}
                  className="input"
                />
                {openingItemKey === "__new__" ? (
                  <select
                    value={openingForm.unit}
                    onChange={(e) => setOpeningForm({ ...openingForm, unit: e.target.value })}
                    className="select"
                  >
                    {unitOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={openingForm.unit}
                    readOnly
                    className="input"
                    placeholder="Unit"
                  />
                )}
              </div>

              <input
                placeholder="Price per unit"
                type="number"
                value={openingForm.price}
                onChange={(e) => setOpeningForm({ ...openingForm, price: e.target.value })}
                className="input"
              />

              <button
                type="button"
                className="btn primary"
                onClick={saveOpeningStock}
                disabled={openingSaving}
              >
                {openingSaving ? "Saving..." : "Save Opening Stock"}
              </button>

              {openingMessage && <p className="subtitle">{openingMessage}</p>}
            </div>
          </div>

          <div className="card stack">
            <div className="card-header">
              <h2>Reorder List</h2>
              <span className="badge">{reorderList.length} urgent</span>
            </div>
            {loading ? (
              <p className="subtitle">Loading reorder list...</p>
            ) : errorMessage ? (
              <p className="subtitle">{errorMessage}</p>
            ) : reorderList.length === 0 ? (
              <p className="subtitle">All items are healthy.</p>
            ) : (
              <div className="stack">
                {reorderList.map((item) => {
                  const unitLabel = item.unit || "pcs";
                  return (
                    <div key={item._id} className="card" style={{ padding: 14 }}>
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <strong>{item.itemName}</strong>
                        <span className={item.quantity === 0 ? "tag danger" : "tag warn"}>
                          {item.quantity === 0 ? "Out" : `${item.quantity} ${unitLabel} left`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card stack">
            <div className="card-header">
              <h2>Recent Moves</h2>
              <span className="badge">{movements.length} latest</span>
            </div>
            {loading ? (
              <p className="subtitle">Loading activity...</p>
            ) : errorMessage ? (
              <p className="subtitle">{errorMessage}</p>
            ) : movements.length === 0 ? (
              <p className="subtitle">No recent activity.</p>
            ) : (
              <ul className="timeline">
                {movements.map((entry, index) => (
                  <li key={`${entry.type}-${index}`} className="timeline-item">
                    <div>
                      <strong>{entry.itemName}</strong>
                      <p className="subtitle">{formatDateTime(entry.date)}</p>
                    </div>
                    <span className={entry.type === "Purchase" ? "tag good" : "tag danger"}>
                      {entry.type === "Purchase"
                        ? `+${entry.quantity} ${entry.unit || "pcs"}`
                        : `-${entry.quantity} ${entry.unit || "pcs"}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card scroll-card">
          <div className="card-header">
            <h2>Current Stock</h2>
            <span className="badge">Auto refresh</span>
          </div>
          {loading ? (
            <p className="subtitle">Loading stock...</p>
          ) : errorMessage ? (
            <p className="subtitle">{errorMessage}</p>
          ) : (
            <div className="scroll-panel">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Available Quantity</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((item) => {
                    const rowId = item._id || item.id || item.itemName;
                    const unitLabel = item.unit || "pcs";
                    return (
                      <tr key={rowId}>
                        <td>{item.itemName}</td>
                        <td>
                          <div
                            style={{
                              color: item.quantity <= 5 ? 'var(--danger)' : 'var(--good)',
                              fontWeight: 700,
                            }}
                          >
                            {item.quantity === 0 ? 'Out of stock' : `${item.quantity} ${unitLabel}`}
                          </div>
                          {Number(item.openingQuantity) > 0 && (
                            <div className="subtitle">
                              Opening: {item.openingQuantity} {unitLabel}
                            </div>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn danger"
                            onClick={() => deleteStockItem(item)}
                            disabled={deletingId === rowId}
                            type="button"
                          >
                            {deletingId === rowId ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockApp;
