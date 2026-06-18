"use client";

import { useState } from "react";
import { ThemeSelectorCard, ThemeSwitcher } from "@/components/theme-switcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PasswordChanger } from "@/components/password-changer";
import { CurrencyConfig } from "@/components/currency-config";
import { AvatarSwitcher } from "@/components/avatar-switcher";
import { useSettings } from "@/context/settings-context";
import { useAuth } from "@/context/auth-context";
import { Palette, Shield, DollarSign, UserCircle, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
  const { isLoading, settings, refreshSettings } = useSettings();
  const { session } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : session?.user?.email?.[0]?.toUpperCase() || "U";

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSettings();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-black dark:to-purple-950">
      <div className="container mx-auto px-6 py-12 space-y-8">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Separator className="my-8" />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-9">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-black dark:to-purple-950">
      <div className="container mx-auto px-6 py-12 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Settings</h1>
            <Badge variant="secondary">
              <Sparkles className="mr-1 h-3 w-3" />
              Preferences
            </Badge>
          </div>
          <p className="text-muted-foreground">Manage your account and application preferences</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <Separator />

      <Tabs defaultValue="appearance" className="grid gap-6 lg:grid-cols-12">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={settings.avatarUrl || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">{session?.user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Currency</span>
                <span className="font-medium text-foreground">{settings.currency}</span>
              </div>
            </CardContent>
          </Card>

          <TabsList className="flex-col w-full h-auto bg-transparent gap-1">
            <TabsTrigger value="appearance" className="w-full justify-start gap-3 data-[state=active]:bg-muted data-[state=active]:shadow-none">
              <Palette className="h-4 w-4 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium">Appearance</p>
                <p className="text-xs text-muted-foreground">Theme & display</p>
              </div>
            </TabsTrigger>
            <TabsTrigger value="password" className="w-full justify-start gap-3 data-[state=active]:bg-muted data-[state=active]:shadow-none">
              <Shield className="h-4 w-4 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium">Security</p>
                <p className="text-xs text-muted-foreground">Change password</p>
              </div>
            </TabsTrigger>
            <TabsTrigger value="currency" className="w-full justify-start gap-3 data-[state=active]:bg-muted data-[state=active]:shadow-none">
              <DollarSign className="h-4 w-4 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium">Currency</p>
                <p className="text-xs text-muted-foreground">Format preference</p>
              </div>
            </TabsTrigger>
            <TabsTrigger value="avatar" className="w-full justify-start gap-3 data-[state=active]:bg-muted data-[state=active]:shadow-none">
              <UserCircle className="h-4 w-4 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium">Avatar</p>
                <p className="text-xs text-muted-foreground">Profile picture</p>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content */}
        <div className="lg:col-span-9">
          {/* Mobile Tabs */}
          <TabsList className="w-full mb-6 lg:hidden">
            <TabsTrigger value="appearance" className="flex-1">
              <Palette className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="password" className="flex-1">
              <Shield className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="currency" className="flex-1">
              <DollarSign className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="avatar" className="flex-1">
              <UserCircle className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Theme Preferences</CardTitle>
                </div>
                <CardDescription>Customize how the dashboard looks</CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeSelectorCard />
                <Separator className="my-6" />
                <ThemeSwitcher />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="space-y-6 mt-0">
            <PasswordChanger />
          </TabsContent>

          <TabsContent value="currency" className="space-y-6 mt-0">
            <CurrencyConfig />
          </TabsContent>

          <TabsContent value="avatar" className="space-y-6 mt-0">
            <AvatarSwitcher />
          </TabsContent>
        </div>
      </Tabs>
      </div>
    </div>
  );
}
