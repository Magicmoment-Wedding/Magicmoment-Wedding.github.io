export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatNumber(value) {
  return Number(value ?? 0).toLocaleString("ko-KR");
}

export function formatCurrency(value) {
  return `${formatNumber(value)}원`;
}
