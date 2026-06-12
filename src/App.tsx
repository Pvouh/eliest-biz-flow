import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Stock from "./pages/Stock";
import Sales from "./pages/Sales";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import { Package, ShoppingCart, TrendingUp, Bell } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/ThemeToggle";

const queryClient = new QueryClient();

const pageMeta: Record<string, { label: string; icon: React.ElementType }> = {
  "/stock": { label: "Stock Management", icon: Package },
  "/":      { label: "Stock Management", icon: Package },
  "/sales": { label: "Sales Tracking",   icon: ShoppingCart },
  "/analytics": { label: "Analytics Dashboard", icon: TrendingUp },
};

function TopHeader() {
  const { pathname } = useLocation();
  const meta = pageMeta[pathname] ?? { label: "Dashboard", icon: Package };
  const Icon = meta.icon;

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-card border-b border-border/60 shrink-0 z-20 shadow-[var(--shadow-xs)]">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">{meta.label}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  );
}

const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <main className="flex-1 overflow-auto bg-background page-enter">
          {children}
        </main>
      </div>
    </div>
  </SidebarProvider>
);

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/stock"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Stock />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Sales />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Analytics />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Stock />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
