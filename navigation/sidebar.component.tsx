"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronRight, LucideIcon, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export interface SidebarRoute {
  path: string;
  label: string;
  icon: LucideIcon;
  children?: SidebarRoute[];
}

interface SidebarProps {
  routes: SidebarRoute[];
  className?: string;
}

interface SidebarItemProps {
  route: SidebarRoute;
  level?: number;
  onNavigate?: () => void;
}

const ROOT = "/dashboard";

function SidebarItem({ route, level = 0, onNavigate }: SidebarItemProps) {
  const pathname = usePathname();
  const hasChildren = route.children && route.children.length > 0;
  
  // Check if current path matches this route or any of its children
  const isActive = pathname === route.path || (pathname.startsWith(route.path) && route.path != ROOT);
  const isChildActive = hasChildren && route.children?.some(child => 
    pathname === child.path || pathname.startsWith(child.path + '/')
  );
  
  // Track user-initiated expansion separately from auto-expansion
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  
  // Derive expanded state: auto-expand if child is active OR user manually expanded
  const isExpanded = isChildActive || isManuallyExpanded;
  
  const Icon = route.icon;

  const handleClick = () => {
    if (hasChildren) {
      setIsManuallyExpanded(!isExpanded);
    }
  };

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <div>
      <div
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          level > 0 && "ml-6",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-auto w-full justify-start gap-3 p-0 hover:bg-transparent",
              isActive && "text-primary-foreground hover:text-primary-foreground"
            )}
            onClick={handleClick}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-left">{route.label}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 transition-transform" />
            )}
          </Button>
        ) : (
          <Link
            href={route.path}
            className="flex w-full items-center gap-3"
            onClick={handleNavigate}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1">{route.label}</span>
          </Link>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {route.children?.map((child) => (
            <SidebarItem
              key={child.path}
              route={child}
              level={level + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarContent({ routes, onNavigate }: { routes: SidebarRoute[]; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold">ET</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold tracking-tight">Expense Tracker</h2>
            <p className="text-xs text-muted-foreground">v0.0.1</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {routes.map((route) => (
            <SidebarItem key={route.path} route={route} onNavigate={onNavigate} />
          ))}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div className="p-4">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs font-medium">Need help?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Check our documentation
          </p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ routes, className }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-4 z-40 lg:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent routes={routes} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden h-full w-72 flex-col border-r bg-background lg:flex",
          className
        )}
      >
        <SidebarContent routes={routes} />
      </aside>
    </>
  );
}
