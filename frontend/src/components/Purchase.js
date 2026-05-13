import React, { useState } from "react";
import { apiFetch } from "../utils/api";
import { hasAtSymbol, isValidPhone, normalizeEmail, normalizePhone } from "../utils/validation";

const initialDate = new Date().toISOString().slice(0, 10);
const unitOptions = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "L", label: "Liters (L)" },
  { value: "kg", label: "Kilograms (kg)" },
];

const emptyForm = () => ({
  itemName: "",
  itemPrice: "",
  quantity: "",
  unit: "pcs",
  supplierName: "",
  supplierPhone: "",
  supplierGstNumber: "",
  supplierEmail: "",
  supplierAddress: "",
  invoiceNumber: "",
  purchaseDate: initialDate,
  notes: "",
});

const PurchaseEntry = () => {
  const [form, setForm] = useState(emptyForm);
  const [purchaseItems, setPurchaseItems] = useState([]);

  const currentAmount = Number(form.itemPrice || 0) * Number(form.quantity || 0);
  const draftTotal = purchaseItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const updateForm = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const resetItemFields = () => {
    setForm((prev) => ({
      ...prev,
      itemName: "",
      itemPrice: "",
      quantity: "",
      unit: "pcs",
    }));
  };

  const addItemToPurchase = () => {
    const price = Number(form.itemPrice);
    const quantity = Number(form.quantity);

    if (!form.itemName || !Number.isFinite(price) || price < 0 || !Number.isFinite(quantity) || quantity <= 0 || !form.unit) {
      return alert("Enter valid item details");
    }

    setPurchaseItems((prev) => [
      ...prev,
      {
        itemName: form.itemName.trim(),
        price,
        quantity,
        unit: form.unit,
        totalPrice: price * quantity,
      },
    ]);
    resetItemFields();
  };

  const removePurchaseItem = (index) => {
    setPurchaseItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleAddPurchase = async () => {
    const trimmedSupplierName = String(form.supplierName || "").trim();
    const trimmedSupplierEmail = String(form.supplierEmail || "").trim();
    const normalizedSupplierPhone = normalizePhone(form.supplierPhone);
    const itemsToSave = [...purchaseItems];

    if (form.itemName || form.itemPrice || form.quantity) {
      const price = Number(form.itemPrice);
      const quantity = Number(form.quantity);
      if (!form.itemName || !Number.isFinite(price) || price < 0 || !Number.isFinite(quantity) || quantity <= 0 || !form.unit) {
        return alert("Complete the current item details or add it to the list first.");
      }
      itemsToSave.push({
        itemName: form.itemName.trim(),
        price,
        quantity,
        unit: form.unit,
        totalPrice: price * quantity,
      });
    }

    if (!trimmedSupplierName || !normalizedSupplierPhone || !form.purchaseDate || itemsToSave.length === 0) {
      return alert("Enter supplier details and add at least one item");
    }

    if (!isValidPhone(form.supplierPhone)) {
      return alert("Enter a 10 digit mobile number.");
    }

    if (trimmedSupplierEmail && !hasAtSymbol(trimmedSupplierEmail)) {
      return alert("Email must contain @.");
    }

    try {
      for (const item of itemsToSave) {
        const res = await apiFetch("/purchase", {
          method: "POST",
          body: JSON.stringify({
            itemName: item.itemName,
            price: item.price,
            quantity: item.quantity,
            unit: item.unit,
            supplierName: trimmedSupplierName,
            supplierPhone: normalizedSupplierPhone,
            supplierGstNumber: form.supplierGstNumber,
            supplierEmail: trimmedSupplierEmail ? normalizeEmail(trimmedSupplierEmail) : "",
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
      }

      setForm(emptyForm());
      setPurchaseItems([]);
      alert("Purchase saved successfully.");
    } catch (err) {
      alert("Unable to reach the backend. Check that the server is running and the API URL is correct.");
    }
  };

  const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

  return (
    <div className="page full fill">
      <div className="page-header">
        <div>
          <p className="kicker">Purchases</p>
          <h1>Record new inventory</h1>
          <p className="subtitle">Add purchased items here. Purchase history is available in Suppliers.</p>
        </div>
      </div>

      <div className="purchase-entry-layout">
        <div className="card glow stack purchase-form-card">
          <div className="card-header">
            <div>
              <h2>New Purchase</h2>
              <p className="subtitle">Supplier, item, and invoice details.</p>
            </div>
            <span className="badge accent">{formatCurrency(draftTotal + currentAmount)}</span>
          </div>

          <div className="stepper">
            <span className="step active">1 Supplier</span>
            <span className="step active">2 Item</span>
            <span className="step active">3 Invoice</span>
          </div>

          <div className="purchase-form-grid">
            <section className="form-section">
              <div className="section-heading">
                <span className="section-label">Supplier Details</span>
                <span className="badge">Required</span>
              </div>
              <input
                placeholder="Supplier Name *"
                value={form.supplierName}
                onChange={updateForm("supplierName")}
                className="input"
              />
              <div className="field-grid two-fields">
                <input
                  placeholder="Supplier Phone * (10 digits)"
                  type="tel"
                  inputMode="numeric"
                  value={form.supplierPhone}
                  onChange={updateForm("supplierPhone")}
                  className="input"
                />
                <input
                  placeholder="Supplier GST Number"
                  value={form.supplierGstNumber}
                  onChange={updateForm("supplierGstNumber")}
                  className="input"
                />
              </div>
              <input
                placeholder="Supplier Email"
                type="email"
                value={form.supplierEmail}
                onChange={updateForm("supplierEmail")}
                className="input"
              />
              <input
                placeholder="Supplier Address"
                value={form.supplierAddress}
                onChange={updateForm("supplierAddress")}
                className="input"
              />
            </section>

            <section className="form-section">
              <div className="section-heading">
                <span className="section-label">Item Details</span>
                <span className="badge">Stock</span>
              </div>
              <input
                placeholder="Item Name *"
                value={form.itemName}
                onChange={updateForm("itemName")}
                className="input"
              />
              <div className="field-grid three-fields">
                <input
                  placeholder="Item Price *"
                  type="number"
                  value={form.itemPrice}
                  onChange={updateForm("itemPrice")}
                  className="input"
                />
                <input
                  placeholder="Quantity *"
                  type="number"
                  value={form.quantity}
                  onChange={updateForm("quantity")}
                  className="input"
                />
                <select value={form.unit} onChange={updateForm("unit")} className="select">
                  {unitOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={addItemToPurchase} className="btn ghost">
                Add Item
              </button>
            </section>

            <section className="form-section">
              <div className="section-heading">
                <span className="section-label">Invoice & Notes</span>
                <span className="badge">Optional</span>
              </div>
              <div className="field-grid two-fields">
                <input
                  placeholder="Invoice Number"
                  value={form.invoiceNumber}
                  onChange={updateForm("invoiceNumber")}
                  className="input"
                />
                <input
                  type="date"
                  value={form.purchaseDate}
                  onChange={updateForm("purchaseDate")}
                  className="input"
                />
              </div>
              <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={updateForm("notes")}
                className="input"
                rows={3}
              />
            </section>

            {purchaseItems.length > 0 && (
              <section className="form-section">
                <div className="section-heading">
                  <span className="section-label">Items in this purchase</span>
                  <span className="badge accent">{purchaseItems.length} items</span>
                </div>
                <div className="draft-items">
                  {purchaseItems.map((item, index) => (
                    <div key={`${item.itemName}-${index}`} className="draft-item">
                      <div>
                        <strong>{item.itemName}</strong>
                        <span>
                          {item.quantity} {item.unit} at {formatCurrency(item.price)}
                        </span>
                      </div>
                      <div className="row">
                        <strong>{formatCurrency(item.totalPrice)}</strong>
                        <button type="button" className="btn danger" onClick={() => removePurchaseItem(index)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <button onClick={handleAddPurchase} className="btn primary purchase-submit">
              Save Purchase
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PurchaseEntry;
