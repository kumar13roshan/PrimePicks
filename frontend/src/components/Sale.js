import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { hasAtSymbol, isValidPhone, normalizeEmail, normalizePhone } from "../utils/validation";

const initialDate = new Date().toISOString().slice(0, 10);
const unitOptions = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "L", label: "Liters (L)" },
  { value: "kg", label: "Kilograms (kg)" },
];

const SaleManagement = () => {
  const [cart, setCart] = useState([]);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productQuantity, setProductQuantity] = useState("");
  const [productUnit, setProductUnit] = useState("pcs");
  const [totalSale, setTotalSale] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerGstNumber, setCustomerGstNumber] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [saleDate, setSaleDate] = useState(initialDate);
  const [paymentMethod, setPaymentMethod] = useState("");
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

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

  const handleSelectProduct = (name) => {
    setProductName(name);
    const selected = stockList.find((item) => item.itemName === name);
    if (selected) {
      setProductPrice(selected.price);
      setProductUnit(selected.unit || "pcs");
    } else {
      setProductPrice("");
      setProductUnit("pcs");
    }
  };

  const addToCart = () => {
    if (!productName || !productPrice || !productQuantity || !productUnit) {
      alert("Enter all product details");
      return;
    }

    const selectedStock = stockList.find((item) => item.itemName === productName);
    const price = Number(productPrice);
    const quantity = Number(productQuantity);
    const quantityAlreadyInCart = cart
      .filter((item) => item.name === productName)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(quantity) || quantity <= 0) {
      alert("Enter valid price and quantity");
      return;
    }

    if (selectedStock && quantityAlreadyInCart + quantity > Number(selectedStock.quantity || 0)) {
      alert(`Only ${selectedStock.quantity} ${selectedStock.unit || "pcs"} available in stock.`);
      return;
    }

    const newProduct = {
      name: productName,
      price,
      quantity,
      unit: productUnit,
      totalPrice: price * quantity,
    };

    setCart((prev) => [...prev, newProduct]);
    setTotalSale((prev) => prev + newProduct.totalPrice);
    setProductName("");
    setProductPrice("");
    setProductQuantity("");
    setProductUnit("pcs");
  };

  const removeFromCart = (index) => {
    const removed = cart[index];
    setCart((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setTotalSale((prev) => prev - Number(removed?.totalPrice || 0));
  };

  const processSale = async () => {
    const trimmedCustomerName = String(customerName || "").trim();
    const trimmedCustomerEmail = String(customerEmail || "").trim();
    const normalizedCustomerPhone = normalizePhone(customerPhone);

    if (!trimmedCustomerName || !normalizedCustomerPhone || !invoiceNumber || !saleDate) {
      return alert("Enter customer and invoice details");
    }
    if (!paymentMethod) return alert("Select payment method");
    if (!cart.length) return alert("Cart empty");

    if (!isValidPhone(customerPhone)) {
      return alert("Enter a 10 digit mobile number.");
    }

    if (trimmedCustomerEmail && !hasAtSymbol(trimmedCustomerEmail)) {
      return alert("Email must contain @.");
    }

    const quantityByItem = cart.reduce((summary, item) => {
      summary[item.name] = (summary[item.name] || 0) + Number(item.quantity || 0);
      return summary;
    }, {});

    for (const [name, quantity] of Object.entries(quantityByItem)) {
      const stockItem = stockList.find((item) => item.itemName === name);
      if (!stockItem || quantity > Number(stockItem.quantity || 0)) {
        return alert(`Not enough stock for ${name}.`);
      }
    }

    for (const item of cart) {
      const res = await apiFetch("/sale", {
        method: "POST",
        body: JSON.stringify({
          itemName: item.name,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit,
          paymentType: paymentMethod,
          customerName: trimmedCustomerName,
          customerPhone: normalizedCustomerPhone,
          customerGstNumber,
          customerEmail: trimmedCustomerEmail ? normalizeEmail(trimmedCustomerEmail) : "",
          customerAddress,
          invoiceNumber,
          saleDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return alert(data.message || "Failed to process sale");
      }
    }

    await loadStock();
    alert(`Sale processed: ${formatCurrency(totalSale)}`);
    setCart([]);
    setTotalSale(0);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerGstNumber("");
    setCustomerEmail("");
    setCustomerAddress("");
    setInvoiceNumber("");
    setSaleDate(initialDate);
    setPaymentMethod("");
  };

  return (
    <div className="page fill full">
      <div className="page-header">
        <div>
          <p className="kicker">Sales</p>
          <h1>Sale Entry</h1>
          <p className="subtitle">Create a sale here. Sale history is available in Customers.</p>
        </div>
        <span className="badge accent">Total: {formatCurrency(totalSale)}</span>
      </div>

      <div className="purchase-entry-layout">
        <div className="sale-entry-grid">
          <div className="card glow stack sale-form-card">
            <div className="card-header">
              <div>
                <h2>Sale Details</h2>
                <p className="subtitle">Customer, product, and payment details.</p>
              </div>
              <span className="badge">Required *</span>
            </div>
            <div className="stepper">
              <span className="step active">1 Customer</span>
              <span className="step active">2 Items</span>
              <span className="step active">3 Payment</span>
            </div>

            <div className="purchase-form-grid">
              <section className="form-section">
                <div className="section-heading">
                  <span className="section-label">Customer Details</span>
                  <span className="badge">Required</span>
                </div>
                <input
                  type="text"
                  placeholder="Customer Name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input"
                />
                <div className="field-grid two-fields">
                  <input
                    type="tel"
                    placeholder="Phone Number * (10 digits)"
                    inputMode="numeric"
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
                </div>
                <div className="field-grid two-fields">
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
                <div className="field-grid two-fields">
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
              </section>

              <section className="form-section">
                <div className="section-heading">
                  <span className="section-label">Item Details</span>
                  <span className="badge">Live stock</span>
                </div>
                <select value={productName} onChange={(e) => handleSelectProduct(e.target.value)} className="select">
                  <option value="">Select Product</option>
                  {stockList.map((item) => (
                    <option key={item._id} value={item.itemName}>
                      {item.itemName}
                    </option>
                  ))}
                </select>
                <div className="field-grid three-fields">
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
                  return <input type="text" value={productUnit} readOnly className="input" placeholder="Unit" />;
                }

                return (
                  <select value={productUnit} onChange={(e) => setProductUnit(e.target.value)} className="select">
                    {unitOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                );
              })()}
                </div>
                <button onClick={addToCart} className="btn primary">
                  Add to Cart
                </button>
              </section>

              <section className="form-section">
                <div className="section-heading">
                  <span className="section-label">Payment</span>
                  <span className="badge accent">{formatCurrency(totalSale)}</span>
                </div>
                <div className="payment-options">
                  <label className="payment-option">
                    <input
                      type="radio"
                      value="Cash"
                      checked={paymentMethod === "Cash"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span>Cash</span>
                  </label>
                  <label className="payment-option">
                    <input
                      type="radio"
                      value="Online"
                      checked={paymentMethod === "Online"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span>Online</span>
                  </label>
                </div>
              </section>
            </div>
          </div>

          <div className="card glow stack sale-cart-card">
            <div className="card-header">
              <h2>Cart Summary</h2>
              <span className="badge">{cart.length} items</span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, index) => (
                    <tr key={`${item.name}-${index}`}>
                      <td>{item.name}</td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>
                        {item.quantity} {item.unit || "pcs"}
                      </td>
                      <td>{formatCurrency(item.totalPrice)}</td>
                      <td>
                        <button onClick={() => removeFromCart(index)} className="btn danger">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>Total: {formatCurrency(totalSale)}</strong>
              <span className="badge">{paymentMethod || "Payment pending"}</span>
            </div>

            <button onClick={processSale} className="btn accent">
              Process Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleManagement;
