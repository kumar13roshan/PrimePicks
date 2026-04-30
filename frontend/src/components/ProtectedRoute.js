import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser, isAuthenticated, subscribeToSession } from "../utils/auth";

const ProtectedRoute = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());
  const [uid, setUid] = useState(() => getCurrentUser()?.uid || "");

  useEffect(() => {
    const unsubscribe = subscribeToSession((session) => {
      setAuthenticated(Boolean(session?.token));
      setUid(session?.user?.uid || "");
    });

    return unsubscribe;
  }, []);

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <React.Fragment key={uid}>{children}</React.Fragment>;
};

export default ProtectedRoute;
