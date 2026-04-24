export function fmtMoney(n) {
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "k";
  return "$" + n;
}

export function fmtNum(n) {
  return n.toLocaleString();
}
