"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./auth-context";

interface UserSettings {
  name: string;
  email: string;
  currency: string;
  avatarUrl: string;
}

interface SettingsContextType {
  settings: UserSettings;
  isLoading: boolean;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  updateCurrency: (currency: string) => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  name: "",
  email: "",
  currency: "PHP",
  avatarUrl: "",
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings({
          name: data.name ?? "",
          email: data.email ?? "",
          currency: data.currency ?? "PHP",
          avatarUrl: data.avatarUrl ?? "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      refreshSettings();
    }
  }, [session, refreshSettings]);

  const updateProfile = async (data: { name?: string; email?: string }) => {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update profile");
    }

    await refreshSettings();
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    const response = await fetch("/api/settings/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to change password");
    }
  };

  const updateCurrency = async (currency: string) => {
    const response = await fetch("/api/settings/currency", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update currency");
    }

    await refreshSettings();
  };

  const updateAvatar = async (avatarUrl: string) => {
    const response = await fetch("/api/settings/avatar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update avatar");
    }

    await refreshSettings();
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateProfile,
        changePassword,
        updateCurrency,
        updateAvatar,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}