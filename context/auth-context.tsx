"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Session } from "next-auth";

interface UserSession extends Session {
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface AuthContextType {
  session: UserSession | null;
  status: "loading" | "authenticated" | "unauthenticated";
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        
        if (response.ok) {
          const data = await response.json();
          setSession(data.session);
          setStatus("authenticated");
        } else {
          setSession(null);
          setStatus("unauthenticated");
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
        setSession(null);
        setStatus("unauthenticated");
      }
    };

    fetchSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        status,
        isLoading: status === "loading",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
