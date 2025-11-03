"use client";

import { AuthProvider } from "@/context/auth-context";
import { Sidebar, SidebarRoute } from "@/navigation/sidebar.component";
import { Home, Settings, Tag, Wallet } from "lucide-react";

const routes: SidebarRoute[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: Home,
  },
  {
    path: "/dashboard/payroll",
    label: "Payroll",
    icon: Wallet,
  },
  {
    path: "/dashboard/expense-types",
    label: "Expense Types",
    icon: Tag,
  },
  {
    path: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen">
        <Sidebar routes={routes} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}