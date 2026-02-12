export const normalizePhone = (value) => String(value || "").replace(/\D/g, "");

export const isValidPhone = (value) => normalizePhone(value).length === 10;

export const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

export const hasAtSymbol = (value) => String(value || "").includes("@");

export const normalizeNameKey = (value) => String(value || "").trim().toLowerCase();
