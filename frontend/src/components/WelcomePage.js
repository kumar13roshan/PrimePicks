import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/PrimePicks.png";

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="page full hero">
      <div className="card glow hero-card stagger">
        <img src={logo} alt="PrimePicks Logo" className="hero-logo" />
        <p className="kicker">PrimePicks</p>
        <h1 className="hero-title">Run your store with calm, confident control.</h1>
        <p className="subtitle">
          Track purchases, sales, stock, and transactions from one beautiful,
          focused dashboard.
        </p>
        <div className="hero-actions">
          <button className="btn accent" onClick={() => navigate("/login")}>Get Started</button>
          <span className="hero-note">Secure sign-in with email or Google</span>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
