import React from "react";
import { useNavigate } from "react-router-dom";

const baseStyle = {
  padding: "8px 14px",
  background: "var(--back-bg)",
  border: "1px solid var(--back-border)",
  borderRadius: "6px",
  cursor: "pointer",
  marginBottom: "10px",
  fontSize: "1rem",
};

export default function BackButton({ className = "", style = {} }) {
  const nav = useNavigate();
  return (
    <button
      type="button"
      onClick={() => nav(-1)}
      className={className}
      style={{ ...baseStyle, ...style }}
    >
      ← Back
    </button>
  );
}
