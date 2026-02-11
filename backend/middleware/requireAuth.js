import admin from "../config/firebaseAdmin.js";

const requireAuth = async (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer (.+)$/i);

  if (!match) {
    return res.status(401).json({ message: "Missing Authorization header" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(match[1]);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || "",
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid auth token" });
  }
};

export default requireAuth;
