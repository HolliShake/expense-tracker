"use client";

import { useSettings } from "@/context/settings-context";

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

export function useCurrency() {
  const { settings } = useSettings();
  const code = settings.currency || "PHP";

  const formatCurrency = (amount: number): string => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      // Fallback for unsupported Intl currencies
      const symbol = SYMBOL_MAP[code] || code;
      return `${symbol}${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
  };

  const formatCurrencyShort = (amount: number): string => {
    const symbol = SYMBOL_MAP[code] || code;
    if (amount >= 1_000_000) {
      return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (amount >= 1_000) {
      return `${symbol}${(amount / 1_000).toFixed(1)}K`;
    }
    return formatCurrency(amount);
  };

  return { formatCurrency, formatCurrencyShort, currency: code };
}