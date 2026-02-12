import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const API_BASE = process.env.REACT_APP_API_URL || "/api";

const waitForAuth = () =>
  new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });

const getAuthToken = async () => {
  let user = auth.currentUser;
  if (!user) {
    user = await waitForAuth();
  }
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user.getIdToken(true);
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
