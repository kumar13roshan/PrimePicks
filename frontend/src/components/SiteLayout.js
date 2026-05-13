import React from "react";
import { NavLink } from "react-router-dom";
import logo from "../assets/PrimePicks.png";
import ProfileMenu from "./ProfileMenu";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/purchase", label: "Purchase" },
  { to: "/sale", label: "Sales" },
  { to: "/stock", label: "Stock" },
  { to: "/transaction", label: "Transactions" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/customers", label: "Customers" },
];

const SiteLayout = ({ children }) => (
  <div className="site-shell">
    <header className="site-header">
      <NavLink to="/dashboard" className="site-brand" aria-label="PrimePicks dashboard">
        <img src={logo} alt="" />
        <div>
          <strong>PrimePicks</strong>
          <span>Business Manager</span>
        </div>
      </NavLink>
      <nav className="site-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `site-nav-link${isActive ? " active" : ""}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="site-actions">
        <ProfileMenu />
      </div>
    </header>

    <main className="site-main">{children}</main>

    <footer className="site-footer">
      <span>PrimePicks</span>
      <span>Sales, stock, customers, and payments in one place.</span>
    </footer>
  </div>
);

export default SiteLayout;
