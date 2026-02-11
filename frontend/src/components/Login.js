import React, { useEffect, useState } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import logo from "../assets/PrimePicks.png";
import BackButton from "./BackButton";
import { auth, provider } from "../firebase";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/dashboard", { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error(error);
      setErrorMessage("Google login failed. Please try again.");
    }
  };

  const handleEmailPasswordLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage("Invalid email or password");
    }
  };

  return (
    <div className="page full hero auth-page">
      <div className="auth-layout card glow stagger">
        <div className="auth-side">
          <div className="auth-brand">
            <img src={logo} alt="PrimePicks Logo" className="auth-logo" />
            <div>
              <p className="auth-kicker">PrimePicks</p>
              <h2 className="auth-title">Welcome back</h2>
              <p className="auth-subtitle">Your store, beautifully organized.</p>
            </div>
          </div>
          <ul className="auth-list">
            <li>Track purchases and stock in real time.</li>
            <li>Send clean invoices with every sale.</li>
            <li>See profit and loss instantly.</li>
          </ul>
          <div className="auth-meta">
            <span className="badge">Secure sign-in</span>
            <span className="badge accent">Lightning fast</span>
          </div>
        </div>

        <div className="auth-form">
          <BackButton />
          <div>
            <h3 className="auth-form-title">Sign in to continue</h3>
            <p className="subtitle">Access your dashboard in seconds.</p>
          </div>
          <div className="stack">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="input"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="input"
            />
            {errorMessage && <p className="auth-error">{errorMessage}</p>}
            <button onClick={handleEmailPasswordLogin} className="btn primary">
              Login with Email
            </button>
            <div className="row" style={{ justifyContent: "center" }}>
              <span className="badge">OR</span>
            </div>
            <button onClick={handleGoogleLogin} className="btn accent">
              Login with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
