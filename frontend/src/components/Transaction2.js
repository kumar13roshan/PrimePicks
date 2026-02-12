import React, { useEffect, useState } from "react";
import gpayQR from "../assets/gpay.png";
import BackButton from "./BackButton";
import ProfileMenu from "./ProfileMenu";
import { apiFetch } from "../utils/api";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [openingBalances, setOpeningBalances] = useState({ cash: 0, online: 0 });
  const [openingForm, setOpeningForm] = useState({ cash: "0", online: "0" });
  const [openingSaving, setOpeningSaving] = useState(false);
  const [openingError, setOpeningError] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const res = await apiFetch("/sale");
        if (!res.ok) {
          throw new Error("Failed to load transactions");
        }
        const data = await res.json();
        setTransactions(data);
      } catch (err) {
        setErrorMessage("Unable to load transactions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    const fetchOpeningBalances = async () => {
      setOpeningError("");
      try {
        const res = await apiFetch("/transaction/opening");
        if (!res.ok) {
          throw new Error("Failed to load opening balances");
        }
        const data = await res.json();
        const cash = Number(data.cash || 0);
        const online = Number(data.online || 0);
        setOpeningBalances({ cash, online });
        setOpeningForm({ cash: String(cash), online: String(online) });
      } catch (err) {
        setOpeningError("Unable to load opening balances.");
      }
    };

    fetchOpeningBalances();
  }, []);

  const cashTransactions = transactions.filter(txn => txn.paymentType === "Cash");
  const onlineTransactions = transactions.filter(txn => txn.paymentType === "Online");

  const [isQrVisible, setQrVisible] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [showGpay, setShowGpay] = useState(false);

  const showQR = () => {
    setQrImage(gpayQR);
    setPaymentDetails({
      transactionId: "TX123456",
      amount: "₹500",
      date: "2025-03-31",
      status: "Pending",
      paymentMethod: "GPay",
    });
    setQrVisible(true);
  };

  const handleOnlineTransactionsClick = () => {
    setShowGpay(true);
  };

  const handlePaymentOption = () => {
    alert("Payment Proceeded");
    setQrVisible(false);
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  const getTotal = (txn) => Number(txn.price || 0) * Number(txn.quantity || 0);
  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;

  const cashSalesTotal = cashTransactions.reduce((sum, txn) => sum + getTotal(txn), 0);
  const onlineSalesTotal = onlineTransactions.reduce((sum, txn) => sum + getTotal(txn), 0);
  const cashTotal = Number(openingBalances.cash || 0) + cashSalesTotal;
  const onlineTotal = Number(openingBalances.online || 0) + onlineSalesTotal;

  const saveOpeningBalances = async () => {
    const cash = Number(openingForm.cash);
    const online = Number(openingForm.online);

    if (!Number.isFinite(cash) || cash < 0 || !Number.isFinite(online) || online < 0) {
      return alert("Opening balances must be 0 or more.");
    }

    setOpeningSaving(true);
    setOpeningError("");
    try {
      const res = await apiFetch("/transaction/opening", {
        method: "POST",
        body: JSON.stringify({ cash, online }),
      });
      const data = await res.json();
      if (!res.ok) {
        return alert(data.message || "Failed to save opening balances");
      }
      setOpeningBalances({ cash, online });
      setOpeningForm({ cash: String(cash), online: String(online) });
    } catch (err) {
      alert("Unable to reach the backend. Check that the server is running.");
    } finally {
      setOpeningSaving(false);
    }
  };

  return (
    <div className="page full">
      <div className="topbar">
        <BackButton />
        <ProfileMenu />
      </div>
      <div className="page-header">
        <div>
          <p className="kicker">Transactions</p>
          <h1>Transaction Records</h1>
          <p className="subtitle">Keep tabs on cash and online payments.</p>
        </div>
        <span className="badge">{transactions.length} total</span>
      </div>

      <div className="grid two">
        <section className="card">
          <div className="card-header">
            <div>
              <h2>Opening Balances</h2>
              <p className="subtitle">Set the starting cash and online balances.</p>
            </div>
            <span className="badge">Start-up</span>
          </div>
          <div className="row">
            <div className="field">
              <span>Cash Opening</span>
              <input
                type="number"
                className="input"
                value={openingForm.cash}
                onChange={(e) => setOpeningForm({ ...openingForm, cash: e.target.value })}
              />
            </div>
            <div className="field">
              <span>Online Opening</span>
              <input
                type="number"
                className="input"
                value={openingForm.online}
                onChange={(e) => setOpeningForm({ ...openingForm, online: e.target.value })}
              />
            </div>
          </div>
          <button
            type="button"
            className="btn primary"
            onClick={saveOpeningBalances}
            disabled={openingSaving}
          >
            {openingSaving ? "Saving..." : "Save Opening Balances"}
          </button>
          {openingError && <p className="subtitle">{openingError}</p>}
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h2>Totals</h2>
              <p className="subtitle">Sales totals plus opening balances.</p>
            </div>
            <span className="badge accent">Updated</span>
          </div>
          <div className="stack sm">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span>Cash Sales</span>
              <strong>{formatCurrency(cashSalesTotal)}</strong>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span>Cash Opening</span>
              <strong>{formatCurrency(openingBalances.cash)}</strong>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span>Total Cash</span>
              <strong>{formatCurrency(cashTotal)}</strong>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span>Online Sales</span>
              <strong>{formatCurrency(onlineSalesTotal)}</strong>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span>Online Opening</span>
              <strong>{formatCurrency(openingBalances.online)}</strong>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span>Total Online</span>
              <strong>{formatCurrency(onlineTotal)}</strong>
            </div>
          </div>
        </section>
      </div>

      <div className="grid two">
        <section className="card">
          <div className="card-header">
            <div>
              <h2>Cash Transactions</h2>
              <p className="subtitle">Total: {formatCurrency(cashTotal)}</p>
            </div>
            <span className="badge">{cashTransactions.length}</span>
          </div>
          {loading ? (
            <p className="subtitle">Loading...</p>
          ) : errorMessage ? (
            <p className="subtitle">{errorMessage}</p>
          ) : cashTransactions.length > 0 ? (
            <ul className="list">
              {cashTransactions.map((txn, index) => (
                <li key={index} className="list-item">
                  <strong>Invoice:</strong> {txn.invoiceNumber || txn._id} <br />
                  <strong>Amount:</strong> ₹{getTotal(txn)} <br />
                  <strong>Customer:</strong>{" "}
                  {([txn.customerName, txn.customerPhone].filter(Boolean).join(" · ")) || "-"} <br />
                  <strong>Payment Mode:</strong> {txn.paymentType} <br />
                  <strong>Date:</strong> {formatDate(txn.saleDate || txn.date)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="subtitle">No Cash Transactions Found</p>
          )}
        </section>

        <section className="card clickable" onClick={handleOnlineTransactionsClick}>
          <div className="card-header">
            <div>
              <h2>Online Transactions</h2>
              <p className="subtitle">Total: {formatCurrency(onlineTotal)}</p>
            </div>
            <span className="badge accent">{onlineTransactions.length}</span>
          </div>
          {loading ? (
            <p className="subtitle">Loading...</p>
          ) : errorMessage ? (
            <p className="subtitle">{errorMessage}</p>
          ) : onlineTransactions.length > 0 ? (
            <ul className="list">
              {onlineTransactions.map((txn, index) => (
                <li key={index} className="list-item">
                  <strong>Invoice:</strong> {txn.invoiceNumber || txn._id} <br />
                  <strong>Amount:</strong> ₹{getTotal(txn)} <br />
                  <strong>Customer:</strong>{" "}
                  {([txn.customerName, txn.customerPhone].filter(Boolean).join(" · ")) || "-"} <br />
                  <strong>Payment Mode:</strong> {txn.paymentType} <br />
                  <strong>Date:</strong> {formatDate(txn.saleDate || txn.date)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="subtitle">No Online Transactions Found</p>
          )}
          {showGpay && onlineTransactions.length > 0 && !loading && !errorMessage && (
            <button className="btn primary" onClick={showQR}>Pay with GPay</button>
          )}
        </section>
      </div>

      {isQrVisible && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-card stack">
            <div className="card-header">
              <h2>Scan the QR Code</h2>
              <button className="btn ghost" onClick={() => setQrVisible(false)}>
                Close
              </button>
            </div>
            <div className="row" style={{ justifyContent: "center" }}>
              <img src={qrImage} alt="QR Code" className="modal-image" />
            </div>
            {paymentDetails && (
              <div className="stack sm">
                <h3>Transaction Details</h3>
                <div className="card" style={{ padding: 14 }}>
                  <p><strong>Transaction ID:</strong> {paymentDetails.transactionId}</p>
                  <p><strong>Amount:</strong> {paymentDetails.amount}</p>
                  <p><strong>Date:</strong> {paymentDetails.date}</p>
                  <p><strong>Status:</strong> {paymentDetails.status}</p>
                  <p><strong>Payment Method:</strong> {paymentDetails.paymentMethod}</p>
                </div>
                <button className="btn accent" onClick={handlePaymentOption}>Show Option</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
