import React, { useEffect, useState } from "react";
import gpayQR from "../assets/gpay.png";
import BackButton from "./BackButton";
import ProfileMenu from "./ProfileMenu";

const API = process.env.REACT_APP_API_URL || "/api";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const res = await fetch(`${API}/sale`);
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
            <h2>Cash Transactions</h2>
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
            <h2>Online Transactions</h2>
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
