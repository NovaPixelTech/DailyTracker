import { Link, useLocation } from "wouter";
import { Activity, BarChart2, Calendar, LayoutDashboard, Settings, Moon, Sun, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";
import { useHealthCheck } from "@/lib/api";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { data: health } = useHealthCheck();

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/history", icon: Calendar, label: "History" },
    { href: "/stats", icon: BarChart2, label: "Stats" },
    { href: "/profile", icon: Settings, label: "Profile" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 text-primary font-semibold text-xl">
            <Activity className="h-6 w-6" />
            <span>CalTrack</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                location === item.href
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-muted-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-5 w-5 mr-3" /> Light Mode
              </>
            ) : (
              <>
                <Moon className="h-5 w-5 mr-3" /> Dark Mode
              </>
            )}
          </Button>

          <div className="flex items-center px-2 py-1 text-xs text-muted-foreground">
            <Server className="h-3 w-3 mr-2" />
            API: {health?.status === "ok" ? "Online" : "Checking..."}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
