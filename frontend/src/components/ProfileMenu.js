import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/PrimePicks.png";
import { clearSession, getCurrentUser, subscribeToSession } from "../utils/auth";

const ProfileMenu = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(() => getCurrentUser());
  const menuRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToSession((session) => {
      setUserInfo(session?.user || null);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="profile-area" ref={menuRef}>
      <button
        type="button"
        className="profile-button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
      >
        <img src={logo} alt="Account" />
      </button>
      {open && (
        <div className="profile-menu" role="menu">
          <div className="card profile-card">
            <strong>{userInfo?.name || "PrimePicks Admin"}</strong>
            <span className="subtitle">{userInfo?.email || "No email connected"}</span>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setOpen(false);
                navigate("/admin-details");
              }}
            >
              Admin Details
            </button>
            <button type="button" onClick={handleLogout} className="btn accent">
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
