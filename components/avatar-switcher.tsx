"use client";

import { useState } from "react";
import { useSettings } from "@/context/settings-context";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, CheckCircle, AlertCircle, ImageIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const AVATAR_OPTIONS = [
  { value: "", label: "Initials", seed: "" },
  { value: "https://api.dicebear.com/9.x/avataaars/svg?seed=default", label: "Default", seed: "default" },
  { value: "https://api.dicebear.com/9.x/avataaars/svg?seed=boy", label: "Boy", seed: "boy" },
  { value: "https://api.dicebear.com/9.x/avataaars/svg?seed=girl", label: "Girl", seed: "girl" },
  { value: "https://api.dicebear.com/9.x/avataaars/svg?seed=man", label: "Man", seed: "man" },
  { value: "https://api.dicebear.com/9.x/avataaars/svg?seed=woman", label: "Woman", seed: "woman" },
  { value: "https://api.dicebear.com/9.x/avataaars/svg?seed=cat", label: "Cat", seed: "cat" },
  { value: "https://api.dicebear.com/9.x/avataaars/svg?seed=dog", label: "Dog", seed: "dog" },
  { value: "https://api.dicebear.com/9.x/avataaars/svg?seed=robot", label: "Robot", seed: "robot" },
  { value: "https://api.dicebear.com/9.x/avataaars/svg?seed=alien", label: "Alien", seed: "alien" },
  { value: "https://api.dicebear.com/9.x/bottts/svg?seed=custom", label: "Bot", seed: "custom" },
  { value: "https://api.dicebear.com/9.x/icons/svg?seed=face", label: "Icon", seed: "face" },
];

export function AvatarSwitcher() {
  const { settings, updateAvatar } = useSettings();
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const handleSelect = async (value: string) => {
    setMessage(null);
    if (value === settings.avatarUrl) return;

    setIsSubmitting(value);
    try {
      await updateAvatar(value);
      setMessage({ type: "success", text: "Avatar updated" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update avatar",
      });
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-lg">Avatar</CardTitle>
            <CardDescription>Choose an avatar for your profile</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-border">
            <AvatarImage
              src={settings.avatarUrl || undefined}
              alt="Current avatar"
            />
            <AvatarFallback className="text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">Current Avatar</p>
            <p className="text-xs text-muted-foreground">
              {settings.avatarUrl
                ? AVATAR_OPTIONS.find((a) => a.value === settings.avatarUrl)?.label ?? "Custom"
                : "Showing initials"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {AVATAR_OPTIONS.map((avatar) => {
            const isSelected = settings.avatarUrl === avatar.value;
            const isLoading = isSubmitting === avatar.value;

            return (
              <button
                key={avatar.value}
                type="button"
                onClick={() => handleSelect(avatar.value)}
                disabled={isSubmitting !== null}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:border-muted-foreground/30 hover:bg-accent/50",
                  isSubmitting !== null && !isLoading && "pointer-events-none opacity-50"
                )}
                title={avatar.label}
              >
                {isSelected && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <CheckCircle className="h-3 w-3 text-primary-foreground" />
                  </span>
                )}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
                {avatar.value ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatar.value} alt={avatar.label} />
                    <AvatarFallback>
                      <ImageIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {initials}
                  </div>
                )}
                <span className="text-[10px] text-muted-foreground truncate max-w-full">
                  {avatar.label}
                </span>
              </button>
            );
          })}
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
      </CardContent>
    </Card>
  );
}