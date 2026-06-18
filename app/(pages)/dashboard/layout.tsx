"use client";

import { useAuth } from "@/context/auth-context";
import { AuthProvider } from "@/context/auth-context";
import { SettingsProvider, useSettings } from "@/context/settings-context";
import { Sidebar, SidebarRoute } from "@/navigation/sidebar.component";
import { Home, LogOut, Settings, Tag, User, ChevronDown, Wallet } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

function HeaderContent() {
  const { session } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : session?.user?.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md dark:bg-gray-900/80 dark:border-gray-800 min-h-[69px]">
      <div className="container mx-auto flex h-16 items-center justify-end px-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-muted/50 outline-none">
              <Avatar className="h-8 w-8">
                <AvatarImage src={settings.avatarUrl || undefined} alt="Avatar" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium leading-tight">
                  {session?.user?.name || session?.user?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-xs text-muted-foreground leading-tight">
                  {session?.user?.email}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{session?.user?.name || "User"}</p>
                <p className="text-xs font-normal text-muted-foreground">{session?.user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <div className="flex h-screen">
          <Sidebar routes={routes} />
          <main className="flex-1 overflow-y-auto">
            <HeaderContent />
            {children}
          </main>
        </div>
      </SettingsProvider>
    </AuthProvider>
  );
}
