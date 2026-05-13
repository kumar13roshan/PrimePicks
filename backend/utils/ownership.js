export const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

export const ownerIdAliases = (user = {}) => {
  const aliases = [
    String(user.uid || "").trim(),
    normalizeEmail(user.email),
    ...(Array.isArray(user.legacyOwnerIds) ? user.legacyOwnerIds : []),
  ]
    .map((ownerId) => String(ownerId || "").trim())
    .filter(Boolean);
  return [...new Set(aliases)];
};

export const ownerFilter = (user = {}) => ({ ownerId: { $in: ownerIdAliases(user) } });
