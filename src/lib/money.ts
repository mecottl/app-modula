export function formatMoney(value: string | number, currency: string = "MXN") {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(num);
}
