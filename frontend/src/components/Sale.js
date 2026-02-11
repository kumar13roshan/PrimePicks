import React, { useEffect, useState, useCallback } from "react";
import BackButton from "./BackButton";
import ProfileMenu from "./ProfileMenu";
import { apiFetch } from "../utils/api";

const initialDate = new Date().toISOString().slice(0, 10);
const unitOptions = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "L", label: "Liters (L)" },
  { value: "kg", label: "Kilograms (kg)" },
];

const SaleManagement = () => {
  const [cart, setCart] = useState([]);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productQuantity, setProductQuantity] = useState('');
  const [productUnit, setProductUnit] = useState('pcs');
  const [totalSale, setTotalSale] = useState(0);
  const [sales, setSales] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerGstNumber, setCustomerGstNumber] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [saleDate, setSaleDate] = useState(initialDate);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [stockList, setStockList] = useState([]);

  const loadStock = useCallback(async () => {
    try {
      const res = await apiFetch("/stock");
      if (!res.ok) {
        throw new Error("Failed to load stock");
      }
      const data = await res.json();
      setStockList(data);
    } catch (err) {
      console.log("Stock fetch error:", err);
    }
  }, []);

  const loadSales = useCallback(async () => {
    try {
      const res = await apiFetch("/sale");
      if (!res.ok) {
        throw new Error("Failed to load sales");
      }
      const data = await res.json();
      setSales(data);
    } catch (err) {
      console.log("Sale fetch error:", err);
    }
  }, []);

  useEffect(() => {
    loadStock();
    loadSales();
  }, [loadStock, loadSales]);

  const handleSelectProduct = (name) => {
    setProductName(name);
    const selected = stockList.find(item => item.itemName === name);
    if (selected) {
      setProductPrice(selected.price);
      setProductUnit(selected.unit || 'pcs');
    } else {
      setProductPrice('');
      setProductUnit('pcs');
    }
  };

  const addToCart = () => {
    if (!productName || !productPrice || !productQuantity || !productUnit) {
      alert("Enter all product details");
      return;
    }

    const newProduct = {
      name: productName,
      price: Number(productPrice),
      quantity: Number(productQuantity),
      unit: productUnit,
      totalPrice: Number(productPrice) * Number(productQuantity)
    };

    setCart([...cart, newProduct]);
    setTotalSale(totalSale + newProduct.totalPrice);

    setProductName('');
    setProductPrice('');
    setProductQuantity('');
    setProductUnit('pcs');
  };

  const removeFromCart = (index) => {
    const updated = [...cart];
    const removed = updated.splice(index, 1);
    setCart(updated);
    setTotalSale(totalSale - removed[0].totalPrice);
  };

  const processSale = async () => {
    if (!customerName || !customerPhone || !invoiceNumber || !saleDate) {
      return alert("Enter customer and invoice details");
    }
    if (!paymentMethod) return alert("Select payment method");
    if (!cart.length) return alert("Cart empty");

    for (let item of cart) {
      const res = await apiFetch("/sale", {
        method: "POST",
        body: JSON.stringify({
          itemName: item.name,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit,
          paymentType: paymentMethod,
          customerName,
          customerPhone,
          customerGstNumber,
          customerEmail,
          customerAddress,
          invoiceNumber,
          saleDate,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return alert(data.message || "Failed to process sale");
      }
    }

    await loadSales();
    alert(`Sale processed: ₹${totalSale}`);
    setCart([]);
    setTotalSale(0);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerGstNumber('');
    setCustomerEmail('');
    setCustomerAddress('');
    setInvoiceNumber('');
    setSaleDate(initialDate);
    setPaymentMethod('');
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
    if (!sales.length) return alert("No sales to download");

    const headers = [
      "Item Name",
      "Quantity",
      "Unit",
      "Price",
      "Total",
      "Payment Type",
      "Customer Name",
      "Customer Phone",
      "Customer GST Number",
      "Customer Email",
      "Customer Address",
      "Invoice Number",
      "Sale Date",
      "Record Created",
    ];

    const rows = sales.map((s) => [
      s.itemName,
      s.quantity,
      s.unit || "pcs",
      s.price,
      Number(s.price || 0) * Number(s.quantity || 0),
      s.paymentType,
      s.customerName,
      s.customerPhone,
      s.customerGstNumber,
      s.customerEmail,
      s.customerAddress,
      s.invoiceNumber,
      formatDate(s.saleDate || s.date),
      formatDate(s.date),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadInvoice = (invoiceKey) => {
    const relatedSales = sales.filter((sale) => {
      const key = sale.invoiceNumber || sale._id;
      return key === invoiceKey;
    });

    if (!relatedSales.length) {
      return alert("Invoice data not found.");
    }

    const invoice = relatedSales[0];
    const totalAmount = relatedSales.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );

    const invoiceDate = formatDate(invoice.saleDate || invoice.date);

    const html = `<!doctype html>\n<html>\n<head>\n<meta charset="utf-8" />\n<title>Invoice ${invoice.invoiceNumber || invoice._id}</title>\n<style>\n  body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }\n  h1 { margin: 0 0 6px; }\n  .meta { margin-bottom: 16px; font-size: 14px; color: #4b5563; }\n  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }\n  .card { border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; }\n  table { width: 100%; border-collapse: collapse; }\n  th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; text-align: left; }\n  th { background: #f9fafb; }\n  .total { text-align: right; font-weight: bold; margin-top: 12px; }\n</style>\n</head>\n<body>\n  <h1>PrimePicks Invoice</h1>\n  <div class="meta">Invoice: ${invoice.invoiceNumber || invoice._id} · Date: ${invoiceDate}</div>\n  <div class="grid">\n    <div class="card">\n      <strong>Customer</strong><br />\n      ${invoice.customerName || "-"}<br />\n      ${invoice.customerPhone || "-"}<br />\n      ${invoice.customerGstNumber ? "GST: " + invoice.customerGstNumber + "<br />" : ""}\n      ${invoice.customerEmail || ""}\n    </div>\n    <div class="card">\n      <strong>Payment</strong><br />\n      ${invoice.paymentType || "-"}<br />\n      ${invoice.customerAddress || ""}\n    </div>\n  </div>\n  <table>\n    <thead>\n      <tr>\n        <th>Item</th>\n        <th>Qty</th>\n        <th>Price</th>\n        <th>Total</th>\n      </tr>\n    </thead>\n    <tbody>\n      ${relatedSales
        .map((item) => {
          const itemTotal = Number(item.price || 0) * Number(item.quantity || 0);
          const unitLabel = item.unit || "pcs";
          return `<tr><td>${item.itemName}</td><td>${item.quantity} ${unitLabel}</td><td>₹${item.price}</td><td>₹${itemTotal}</td></tr>`;
        })
        .join("")}\n    </tbody>\n  </table>\n  <div class="total">Grand Total: ₹${totalAmount}</div>\n  <script>window.onload = () => { window.print(); };</script>\n</body>\n</html>`;

    const invoiceWindow = window.open("", "_blank", "width=860,height=720");
    if (!invoiceWindow) {
      alert("Please allow popups to download invoices.");
      return;
    }
    invoiceWindow.document.open();
    invoiceWindow.document.write(html);
    invoiceWindow.document.close();
  };

  const deleteSale = async (id) => {
    try {
      const res = await apiFetch(`/sale/${id}`, { method: "DELETE" });
      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        data = {};
      }
      if (!res.ok) {
        return alert(data.message || "Failed to delete sale");
      }
      await loadSales();
    } catch (err) {
      alert("Unable to reach the backend. Check that the server is running.");
    }
  };

  return (
    <div className="page fill full">
      <div className="topbar">
        <BackButton />
        <ProfileMenu />
      </div>
      <div className="page-header">
        <div>
          <p className="kicker">Sales</p>
          <h1>Sale Management</h1>
          <p className="subtitle">Build a cart, choose payment, and finalize the sale.</p>
        </div>
        <div className="row">
          <span className="badge accent">Total: ₹{totalSale}</span>
          <button className="btn ghost" onClick={downloadCSV}>Download CSV</button>
        </div>
      </div>

      <div className="grid two">
        <div className="column">
          <div className="card glow stack">
            <div className="card-header">
              <h2>Sale Details</h2>
              <span className="badge">Required *</span>
            </div>
            <div className="stepper">
              <span className="step active">1 Customer</span>
              <span className="step active">2 Items</span>
              <span className="step active">3 Payment</span>
            </div>
            <span className="section-label">Customer Details</span>
            <input
              type="text"
              placeholder="Customer Name *"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input"
            />
            <input
              type="tel"
              placeholder="Phone Number *"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="GST Number"
              value={customerGstNumber}
              onChange={(e) => setCustomerGstNumber(e.target.value)}
              className="input"
            />
            <div className="row">
              <input
                type="email"
                placeholder="Email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Invoice Number *"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="input"
              />
            </div>
            <div className="row">
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Customer Address"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="card stack">
            <div className="card-header">
              <h2>Add Products</h2>
              <span className="badge">Live stock</span>
            </div>
            <span className="section-label">Item Details</span>
            <select
              value={productName}
              onChange={(e) => handleSelectProduct(e.target.value)}
              className="select"
            >
              <option value="">Select Product</option>
              {stockList.map((item) => (
                <option key={item._id} value={item.itemName}>{item.itemName}</option>
              ))}
            </select>
            <div className="row">
              <input
                type="number"
                placeholder="Price"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                className="input"
              />
              <input
                type="number"
                placeholder="Quantity"
                value={productQuantity}
                onChange={(e) => setProductQuantity(e.target.value)}
                className="input"
              />
              {(() => {
                const selectedItem = stockList.find((item) => item.itemName === productName);
                if (selectedItem?.unit) {
                  return (
                    <input
                      type="text"
                      value={productUnit}
                      readOnly
                      className="input"
                      placeholder="Unit"
                    />
                  );
                }

                return (
                  <select
                    value={productUnit}
                    onChange={(e) => setProductUnit(e.target.value)}
                    className="select"
                  >
                    {unitOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                );
              })()}
            </div>
            <button onClick={addToCart} className="btn primary">Add to Cart</button>
          </div>

          <div className="card glow stack">
            <div className="card-header">
              <h2>Cart Summary</h2>
              <span className="badge">{cart.length} items</span>
            </div>
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>₹{item.price}</td>
                    <td>{item.quantity} {item.unit || "pcs"}</td>
                    <td>₹{item.totalPrice}</td>
                    <td>
                      <button onClick={() => removeFromCart(index)} className="btn danger">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>Total: ₹{totalSale}</strong>
              <div className="row">
                <label className="row" style={{ gap: 6 }}>
                  <input
                    type="radio"
                    value="Cash"
                    checked={paymentMethod === "Cash"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  Cash
                </label>
                <label className="row" style={{ gap: 6 }}>
                  <input
                    type="radio"
                    value="Online"
                    checked={paymentMethod === "Online"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  Online
                </label>
              </div>
            </div>

            <button onClick={processSale} className="btn accent">Process Sale</button>
          </div>
        </div>

        <div className="card scroll-card">
          <div className="card-header">
            <h2>Sales List</h2>
            <span className="badge">{sales.length} records</span>
          </div>
          {sales.length === 0 ? (
            <p className="subtitle">No sales found</p>
          ) : (
            <div className="stack scroll-panel">
              {sales.map((s) => (
                <div key={s._id} className="card" style={{ padding: 14 }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div className="stack sm">
                      <strong>{s.itemName}</strong>
                      <p className="subtitle">{s.quantity} {s.unit || "pcs"} · ₹{s.price}</p>
                      <p className="subtitle">Total: ₹{Number(s.price || 0) * Number(s.quantity || 0)}</p>
                      <p className="subtitle">Customer: {([s.customerName, s.customerPhone].filter(Boolean).join(" · ")) || "-"}</p>
                      {s.customerGstNumber && <p className="subtitle">GST: {s.customerGstNumber}</p>}
                      {s.customerEmail && <p className="subtitle">Email: {s.customerEmail}</p>}
                      {s.customerAddress && <p className="subtitle">Address: {s.customerAddress}</p>}
                      {s.invoiceNumber && <p className="subtitle">Invoice: {s.invoiceNumber}</p>}
                      <p className="subtitle">Sale Date: {formatDate(s.saleDate || s.date)}</p>
                      {s.paymentType && <p className="subtitle">Payment: {s.paymentType}</p>}
                    </div>
                    <div className="row">
                      <button
                        onClick={() => downloadInvoice(s.invoiceNumber || s._id)}
                        className="btn ghost"
                      >
                        Invoice
                      </button>
                      <button
                        onClick={() => deleteSale(s._id)}
                        className="btn danger"
                      >
                        Delete
                      </button>
                    </div>
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

export default SaleManagement;
