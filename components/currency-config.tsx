"use client";

import { useState, useEffect, useRef } from "react";
import { useSettings } from "@/context/settings-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, AlertCircle, ChevronsUpDown, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const CURRENCIES = [
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
];

export function CurrencyConfig() {
  const { settings, updateCurrency } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCurrency = CURRENCIES.find((c) => c.code === settings.currency) ?? CURRENCIES[0];

  const filtered = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (code: string) => {
    setIsOpen(false);
    setSearch("");
    setMessage(null);

    if (code === settings.currency) return;

    setIsSubmitting(true);
    try {
      await updateCurrency(code);
      setMessage({ type: "success", text: `Currency changed to ${code}` });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update currency",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <DollarSign className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-lg">Currency</CardTitle>
            <CardDescription>Set your preferred currency for expense tracking</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative" ref={dropdownRef}>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            disabled={isSubmitting}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">{selectedCurrency.symbol}</span>
              <span>{selectedCurrency.code}</span>
              <span className="text-xs text-muted-foreground">- {selectedCurrency.name}</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>

          {isOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover text-popover-foreground shadow-lg">
              <div className="p-2">
                <Input
                  placeholder="Search currency..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8"
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto p-1">
                {filtered.length === 0 ? (
                  <p className="p-2 text-center text-sm text-muted-foreground">
                    No currencies found
                  </p>
                ) : (
                  filtered.map((currency) => (
                    <button
                      key={currency.code}
                      type="button"
                      onClick={() => handleSelect(currency.code)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors",
                        currency.code === settings.currency
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-accent"
                      )}
                    >
                      <span className="w-6 text-center text-base">{currency.symbol}</span>
                      <span className="font-medium">{currency.code}</span>
                      <span className="text-xs text-muted-foreground">- {currency.name}</span>
                      {currency.code === settings.currency && (
                        <CheckCircle className="ml-auto h-3.5 w-3.5 text-primary" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {message && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border p-3 text-sm",
              message.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
            )}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {isSubmitting && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating currency...
          </div>
        )}
      </CardContent>
    </Card>
  );
}