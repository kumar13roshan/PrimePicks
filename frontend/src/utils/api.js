import { auth } from "../firebase";

const API_BASE = process.env.REACT_APP_API_URL || "/api";

const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user.getIdToken();
};

export const apiFetch = async (path, options = {}) => {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${API_BASE}${path}`, { ...options, headers });
};

export { API_BASE };
