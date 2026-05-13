import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { getCurrentUser, subscribeToSession } from "../utils/auth";
import { isValidPhone, normalizePhone } from "../utils/validation";

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
  const [user, setUser] = useState(() => getCurrentUser());
  const [email, setEmail] = useState(() => normalizeEmail(getCurrentUser()?.email));
  const [form, setForm] = useState(() => buildEmptyForm(getCurrentUser()?.name || ""));
  const [savedProfile, setSavedProfile] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToSession((session) => {
      const nextUser = session?.user || null;
      setUser(nextUser);
      setEmail(normalizeEmail(nextUser?.email));
      if (!nextUser) {
        navigate("/login", { replace: true });
      }
    });

    return unsubscribe;
  }, [navigate]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const loadProfile = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage("");
      setSavedProfile(null);
      setForm(buildEmptyForm(user.name || ""));
      setShowForm(true);

      try {
        const res = await apiFetch(`/admin?email=${encodeURIComponent(normalizeEmail(user.email))}`, {
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await readJson(res);
          if (!active) return;
          setSavedProfile(data);
          setShowForm(false);
          setForm({
            name: data.name || user.name || "",
            shopName: data.shopName || "",
            gstNumber: data.gstNumber || "",
            address: data.address || "",
            phone: data.phone || "",
          });
        } else if (res.status !== 404) {
          const data = await readJson(res);
          if (active) {
            setErrorMessage(data.message || "Unable to load admin details.");
          }
        } else if (active) {
          setShowForm(true);
        }
      } catch (err) {
        if (err?.name !== "AbortError" && active) {
          setErrorMessage(err?.message || "Unable to load admin details.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
      controller.abort();
    };
  }, [user]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email) {
      setErrorMessage("No email found for this account.");
      return;
    }

    if (!form.name.trim() || !form.shopName.trim() || !form.gstNumber.trim() || !form.address.trim()) {
      setErrorMessage("Please fill all required fields.");
      return;
    }

    if (!isValidPhone(form.phone)) {
      setErrorMessage("Enter a 10 digit phone number.");
      return;
    }

    setSaving(true);

    try {
      const res = await apiFetch("/admin", {
        method: "POST",
        body: JSON.stringify({
          email,
          name: form.name.trim(),
          shopName: form.shopName.trim(),
          gstNumber: form.gstNumber.trim(),
          address: form.address.trim(),
          phone: normalizePhone(form.phone),
        }),
      });

      const data = await readJson(res);
      if (!res.ok) {
        throw new Error(data.message || "Failed to save admin details");
      }

      setSavedProfile(data);
      // ✅ Save ke baad form empty karo
      setForm({
        name: data.name || "",
        shopName: data.shopName || "",
        gstNumber: data.gstNumber || "",
        address: data.address || "",
        phone: data.phone || "",
      });
      setShowForm(false);
      setSuccessMessage("Admin details saved successfully!");
    } catch (err) {
      setErrorMessage(err.message || "Failed to save admin details.");
    } finally {
      setSaving(false);
    }
  };

  // ✅ NEW: Delete handler
  const handleEditProfile = () => {
    setErrorMessage("");
    setSuccessMessage("");
    setForm({
      name: savedProfile?.name || user?.name || "",
      shopName: savedProfile?.shopName || "",
      gstNumber: savedProfile?.gstNumber || "",
      address: savedProfile?.address || "",
      phone: savedProfile?.phone || "",
    });
    setShowForm(true);
  };

  return (
    <div className="page full">
      <div className="page-header">
        <div>
          <p className="kicker">Admin</p>
          <h1>Store Profile</h1>
          <p className="subtitle">Manage the details that will appear on invoices and reports.</p>
        </div>
        <button type="button" className="btn ghost" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
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
                  {/* ✅ Delete button */}
                  <button
                    type="button"
                    className="btn primary"
                    onClick={handleEditProfile}
                    disabled={showForm || saving}
                  >
                    Edit Details
                  </button>
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
            {showForm ? (
              <>
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
                    <span>Phone *</span>
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
              </>
            ) : null}

            {successMessage && (
              <p className="auth-success" aria-live="polite" style={{ color: "green" }}>
                {successMessage}
              </p>
            )}
            {errorMessage && (
              <p className="auth-error" aria-live="polite">
                {errorMessage}
              </p>
            )}

            {showForm && (
              <div className="row">
                <button type="submit" className="btn primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Details"}
                </button>
                {savedProfile && (
                  <button type="button" className="btn ghost" onClick={() => setShowForm(false)} disabled={saving}>
                    Cancel
                  </button>
                )}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminDetails;
