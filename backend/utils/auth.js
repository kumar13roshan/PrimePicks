import crypto from "node:crypto";

const TOKEN_SEPARATOR = ".";
const DEFAULT_SECRET = "primepicks-dev-secret-change-me";
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const base64UrlEncode = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const base64UrlDecode = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
};

const getJwtSecret = () => process.env.JWT_SECRET || DEFAULT_SECRET;

const sign = (value) =>
  base64UrlEncode(crypto.createHmac("sha256", getJwtSecret()).update(value).digest());

export const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const iterations = 100000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
  return `${iterations}:${salt}:${hash}`;
};

export const verifyPassword = (password, storedHash) => {
  const [iterationsRaw, salt, originalHash] = String(storedHash || "").split(":");
  const iterations = Number(iterationsRaw);

  if (!iterations || !salt || !originalHash) {
    return false;
  }

  const computedHash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(computedHash, "hex"), Buffer.from(originalHash, "hex"));
};

export const createToken = (user) => {
  const payload = {
    sub: String(user._id),
    email: String(user.email || "").trim().toLowerCase(),
    name: String(user.name || "").trim(),
    exp: Date.now() + TOKEN_TTL_MS,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}${TOKEN_SEPARATOR}${signature}`;
};

export const verifyToken = (token) => {
  const [encodedPayload, signature] = String(token || "").split(TOKEN_SEPARATOR);

  if (!encodedPayload || !signature) {
    throw new Error("Malformed token");
  }

  const expectedSignature = sign(encodedPayload);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload));

  if (!payload?.sub || !payload?.email || !payload?.exp) {
    throw new Error("Invalid token payload");
  }

  if (Date.now() > Number(payload.exp)) {
    throw new Error("Token expired");
  }

  return payload;
};
