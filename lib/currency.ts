const SYMBOL_MAP: Record<string, string> = {
  PHP: "₱",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
  MYR: "RM",
  IDR: "Rp",
  THB: "฿",
  VND: "₫",
  KRW: "₩",
  CNY: "¥",
  INR: "₹",
};

export function formatCurrency(amount: number, currencyCode: string = "PHP"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const symbol = SYMBOL_MAP[currencyCode] || currencyCode;
    return `${symbol}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

export function formatCurrencyShort(amount: number, currencyCode: string = "PHP"): string {
  const symbol = SYMBOL_MAP[currencyCode] || currencyCode;
  if (amount >= 1_000_000) {
    return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${symbol}${(amount / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(amount, currencyCode);
}