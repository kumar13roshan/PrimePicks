import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import logo from "../assets/PrimePicks.png";

const ProfileMenu = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setUserInfo(null);
        return;
      }

      setUserInfo({
        email: user.email || "",
        name: user.displayName || "PrimePicks Admin",
        photoURL: user.photoURL || "",
      });
    });

    return () => unsubscribe();
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      alert(error.message);
    }
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
        <img src={userInfo?.photoURL || logo} alt="Account" />
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
