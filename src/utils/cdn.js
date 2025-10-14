function isAbs(u) {
  return typeof u === "string" && /^https?:\/\//i.test(u.trim());
}
function getBase() {
  const env = (process.env.EXPO_PUBLIC_S3_URL || "").trim();
  const base = env || "https://kltn2025kiettoan.s3.ap-southeast-2.amazonaws.com";
  return base.replace(/\/+$/, "");
}
function buildUrl(path) {
  if (!path) return "";
  const raw = String(path).trim();
  if (isAbs(raw)) return raw;
  const key = raw.replace(/^\/+/, "");
  return `${getBase()}/${encodeURI(key)}`;
}

export function resolveAssetUrl(path) { return buildUrl(path); }
export function resolveAvatarUrl(path) { return buildUrl(path); }
