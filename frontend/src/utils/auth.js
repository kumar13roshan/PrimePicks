const STORAGE_KEY = "primepicks_session";
const SESSION_EVENT = "primepicks:session-change";

const parseSession = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

export const getSession = () => {
  const rawSession = window.localStorage.getItem(STORAGE_KEY);
  const session = parseSession(rawSession);

  if (!session?.token || !session?.user?.uid || !session?.user?.email) {
    return null;
  }

  return session;
};

export const getToken = () => getSession()?.token || "";
export const getCurrentUser = () => getSession()?.user || null;
export const isAuthenticated = () => Boolean(getToken());

export const saveSession = (session) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_EVENT));
};

export const clearSession = () => {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
};

export const subscribeToSession = (listener) => {
  const handleChange = () => listener(getSession());
  window.addEventListener(SESSION_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(SESSION_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
};
