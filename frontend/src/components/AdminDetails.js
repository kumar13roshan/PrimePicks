import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import ProfileMenu from "./ProfileMenu";

const API = process.env.REACT_APP_API_URL || "/api";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const buildEmptyForm = (name = "") => ({
  name,
  shopName: "",
  gstNumber: "",
  address: "",
  phone: "",
});

const readJson = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  const text = await res.text();
  if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
    throw new Error("API returned HTML. Check backend server or frontend proxy.");
  }
  const message = text && text.length < 200 ? text : "Unexpected server response.";
  throw new Error(message);
};

const AdminDetails = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [form, setForm] = useState(() => buildEmptyForm(""));
  const [savedProfile, setSavedProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    let controller;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;

      if (controller) {
        controller.abort();
        controller = undefined;
      }

      setLoading(true);
      setErrorMessage("");
      setSavedProfile(null);

      if (!user) {
        setEmail("");
        setForm(buildEmptyForm(""));
        setLoading(false);
        navigate("/login", { replace: true });
        return;
      }

      const displayName = String(user.displayName || "").trim();
      const userEmail = normalizeEmail(user.email);
      setEmail(userEmail);
      setForm(buildEmptyForm(displayName));

      if (!userEmail) {
        setErrorMessage("No email found for this account.");
        setLoading(false);
        return;
      }

      try {
        controller = new AbortController();
        const res = await fetch(`${API}/admin?email=${encodeURIComponent(userEmail)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await readJson(res);
          if (!active) return;
          setSavedProfile(data);
          setForm({
            name: data.name || displayName || "",
            shopName: data.shopName || "",
            gstNumber: data.gstNumber || "",
            address: data.address || "",
            phone: data.phone || "",
          });
        } else if (res.status !== 404) {
          const data = await readJson(res);
          setErrorMessage(data.message || "Unable to load admin details.");
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          setErrorMessage(err?.message || "Unable to load admin details.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      if (controller) {
        controller.abort();
      }
      unsubscribe();
    };
  }, [navigate]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!email) {
      setErrorMessage("No email found for this account.");
      return;
    }

    if (!form.name.trim() || !form.shopName.trim() || !form.gstNumber.trim() || !form.address.trim()) {
      setErrorMessage("Please fill all required fields.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API}/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: form.name.trim(),
          shopName: form.shopName.trim(),
          gstNumber: form.gstNumber.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
        }),
      });

      const data = await readJson(res);
      if (!res.ok) {
        throw new Error(data.message || "Failed to save admin details");
      }

      setSavedProfile(data);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setErrorMessage(err.message || "Failed to save admin details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page full">
      <div className="page-header">
        <div>
          <p className="kicker">Admin</p>
          <h1>Store Profile</h1>
          <p className="subtitle">Add the details that will appear on invoices and reports.</p>
        </div>
        <div className="row">
          <button type="button" className="btn ghost" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
          <ProfileMenu />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p className="subtitle">Loading details...</p>
        ) : (
          <form className="stack" onSubmit={handleSubmit}>
            {savedProfile && (
              <div className="card" style={{ background: "var(--surface-alt)" }}>
                <div className="card-header">
                  <h2>Current Admin Details</h2>
                  <span className="badge">Saved</span>
                </div>
                <div className="grid two">
                  <div className="field">
                    <span>Full Name</span>
                    <strong>{savedProfile.name || "-"}</strong>
                  </div>
                  <div className="field">
                    <span>Shop Name</span>
                    <strong>{savedProfile.shopName || "-"}</strong>
                  </div>
                  <div className="field">
                    <span>GST Number</span>
                    <strong>{savedProfile.gstNumber || "-"}</strong>
                  </div>
                  <div className="field">
                    <span>Phone</span>
                    <strong>{savedProfile.phone || "-"}</strong>
                  </div>
                </div>
                <div className="field">
                  <span>Address</span>
                  <strong>{savedProfile.address || "-"}</strong>
                </div>
              </div>
            )}
            <div className="grid two">
              <label className="field">
                <span>Email</span>
                <input className="input" value={email} readOnly />
              </label>
              <label className="field">
                <span>Full Name *</span>
                <input
                  autoComplete="name"
                  className="input"
                  disabled={loading || saving}
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Your name"
                  required
                />
              </label>
              <label className="field">
                <span>Shop Name *</span>
                <input
                  autoComplete="organization"
                  className="input"
                  disabled={loading || saving}
                  value={form.shopName}
                  onChange={handleChange("shopName")}
                  placeholder="Shop or business name"
                  required
                />
              </label>
              <label className="field">
                <span>GST Number *</span>
                <input
                  autoComplete="off"
                  className="input"
                  disabled={loading || saving}
                  value={form.gstNumber}
                  onChange={handleChange("gstNumber")}
                  placeholder="GSTIN"
                  required
                />
              </label>
              <label className="field">
                <span>Phone</span>
                <input
                  autoComplete="tel"
                  className="input"
                  disabled={loading || saving}
                  value={form.phone}
                  onChange={handleChange("phone")}
                  placeholder="Contact number"
                />
              </label>
            </div>
            <label className="field">
              <span>Address *</span>
              <textarea
                autoComplete="street-address"
                className="input"
                disabled={loading || saving}
                rows="3"
                value={form.address}
                onChange={handleChange("address")}
                placeholder="Street, area, city, state, pincode"
                required
              />
            </label>
            {errorMessage && (
              <p className="auth-error" aria-live="polite">
                {errorMessage}
              </p>
            )}
            <div className="row">
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? "Saving..." : "Save Details"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminDetails;
