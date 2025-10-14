export function formatRelativeTime(input) {
  if (!input) return "";
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs <= 0) return "Vừa gửi";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "Vừa gửi";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} tuần trước`;

  const months = Math.floor(days / 30);
  if (months < 1) return `${weeks} tuần trước`;
  if (months < 2) return `${months} tháng trước`;

  const dd = `${date.getDate()}`.padStart(2, "0");
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mi = `${date.getMinutes()}`.padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()} ${hh}:${mi}`;
}