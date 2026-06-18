"use client";

import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/use-hydrated";

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const hydrated = useHydrated();

  const isDark = resolvedTheme === "dark";

  const handleToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  return (
    <div className="flex items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
            isDark
              ? "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
              : "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
          )}
        >
          {hydrated ? (
            isDark ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )
          ) : (
            <div className="h-4 w-4 animate-pulse rounded bg-muted-foreground/30" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">Dark Mode</p>
          <p className="text-xs text-muted-foreground">
            {hydrated ? (isDark ? "On" : "Off") : "—"}
            {hydrated && theme === "system" && (
              <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70">
                SYSTEM
              </span>
            )}
          </p>
        </div>
      </div>
      <Switch
        checked={hydrated ? isDark : false}
        onCheckedChange={handleToggle}
        aria-label="Toggle dark mode"
      />
    </div>
  );
}

export function ThemeSelectorCard() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();

  const modes = [
    {
      value: "light" as const,
      label: "Light",
      icon: Sun,
      description: "Bright and clean interface",
    },
    {
      value: "dark" as const,
      label: "Dark",
      icon: Moon,
      description: "Easy on the eyes at night",
    },
    {
      value: "system" as const,
      label: "System",
      icon: () => (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground">
          Customize how the dashboard looks on your device
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {modes.map(({ value, label, icon: Icon, description }) => {
          const selected = hydrated && theme === value;
          return (
            <button
              key={value}
              type="button"
              disabled={!hydrated}
              onClick={() => setTheme(value)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
                selected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-muted-foreground/30 hover:bg-accent/50",
                !hydrated && "cursor-default opacity-60"
              )}
            >
              {selected && (
                <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
              )}

              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {!hydrated ? (
                  <div className="h-4 w-4 animate-pulse rounded bg-muted-foreground/30" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div className="space-y-0.5">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    selected ? "text-primary" : "text-foreground"
                  )}
                >
                  {!hydrated ? "Loading…" : label}
                </p>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}