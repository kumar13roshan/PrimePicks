import { verifyToken } from "../utils/auth.js";

const requireAuth = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer (.+)$/i);

  if (!match) {
    return res.status(401).json({ message: "Missing Authorization header" });
  }

  try {
    const decoded = verifyToken(match[1]);
    req.user = {
      uid: decoded.sub,
      email: decoded.email,
      name: decoded.name || "",
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired auth token" });
  }
};

export default requireAuth;
