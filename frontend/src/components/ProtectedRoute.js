import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const ProtectedRoute = ({ children }) => {
  const [status, setStatus] = useState("loading");
  const [uid, setUid] = useState("");

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;

      if (!user) {
        setStatus("guest");
        setUid("");
        return;
      }

      setStatus("authed");
      setUid(user.uid || "");
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="page full">
        <p className="subtitle">Checking login…</p>
      </div>
    );
  }

  if (status === "guest") {
    return <Navigate to="/login" replace />;
  }

  return <React.Fragment key={uid}>{children}</React.Fragment>;
};

export default ProtectedRoute;
