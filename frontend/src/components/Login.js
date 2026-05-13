import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/PrimePicks.png";
import BackButton from "./BackButton";
import { API_BASE } from "../utils/api";
import { isAuthenticated, saveSession } from "../utils/auth";
import { isValidPhone, normalizePhone } from "../utils/validation";

const readJson = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return { message: text || "Unexpected server response." };
};

const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    if (mode === "signup") {
      if (!name.trim() || !shopName.trim() || !gstNumber.trim() || !address.trim()) {
        setErrorMessage("Fill all required signup details.");
        return;
      }

      if (!isValidPhone(phone)) {
        setErrorMessage("Enter a 10 digit phone number.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const endpoint = mode === "signup" ? "/auth/signup" : "/auth/login";
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          shopName: shopName.trim(),
          gstNumber: gstNumber.trim(),
          address: address.trim(),
          phone: normalizePhone(phone),
        }),
      });

      const data = await readJson(response);
      if (!response.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      saveSession({
        token: data.token,
        user: data.user,
      });

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(error.message || "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <div className="page full hero auth-page">
      <div className="auth-layout card glow stagger">
        <div className="auth-side">
          <div className="auth-brand">
            <img src={logo} alt="PrimePicks Logo" className="auth-logo" />
            <div>
              <p className="auth-kicker">PrimePicks</p>
              <h2 className="auth-title">{isSignup ? "Create your account" : "Welcome back"}</h2>
              <p className="auth-subtitle">Simple login for your store dashboard.</p>
            </div>
          </div>
          <ul className="auth-list">
            <li>Sign up once and access your inventory anytime.</li>
            <li>Keep purchases, sales, and stock tied to your account.</li>
            <li>No Firebase setup required.</li>
          </ul>
          <div className="auth-meta">
            <span className="badge">{isSignup ? "Quick signup" : "Secure login"}</span>
            <span className="badge accent">JWT session</span>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <BackButton />
          <div>
            <h3 className="auth-form-title">{isSignup ? "Create account" : "Sign in to continue"}</h3>
            <p className="subtitle">
              {isSignup ? "Set up your store account in a minute." : "Access your dashboard in seconds."}
            </p>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button
              type="button"
              className={`btn ${!isSignup ? "primary" : "ghost"}`}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={`btn ${isSignup ? "primary" : "ghost"}`}
              onClick={() => setMode("signup")}
            >
              Sign Up
            </button>
          </div>
          <div className="stack">
            {isSignup && (
              <>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Full Name *"
                  className="input"
                  autoComplete="name"
                />
                <input
                  type="text"
                  value={shopName}
                  onChange={(event) => setShopName(event.target.value)}
                  placeholder="Shop Name *"
                  className="input"
                  autoComplete="organization"
                />
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(event) => setGstNumber(event.target.value)}
                  placeholder="GST Number *"
                  className="input"
                  autoComplete="off"
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Phone Number * (10 digits)"
                  className="input"
                  autoComplete="tel"
                />
                <textarea
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Address *"
                  className="input"
                  rows={3}
                  autoComplete="street-address"
                />
              </>
            )}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="input"
              autoComplete="email"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="input"
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
            {errorMessage && <p className="auth-error">{errorMessage}</p>}
            <button type="submit" className="btn primary" disabled={isSubmitting}>
              {isSubmitting ? "Please wait..." : isSignup ? "Create Account" : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
