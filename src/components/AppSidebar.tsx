import { Package, ShoppingCart, TrendingUp, LogOut, LayoutDashboard } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import elibestLogo from "@/assets/elibest-logo.svg";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Stock",     url: "/stock",     icon: Package,      desc: "Inventory" },
  { title: "Sales",     url: "/sales",     icon: ShoppingCart, desc: "Transactions" },
  { title: "Analytics", url: "/analytics", icon: TrendingUp,   desc: "Insights" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) =>
    currentPath === path || (path === "/stock" && currentPath === "/");

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Error", description: "Failed to sign out", variant: "destructive" });
    } else {
      navigate("/auth");
      toast({ title: "Signed out", description: "You've been successfully signed out" });
    }
  };

  return (
    <Sidebar
      className="border-r-0"
      style={{
        background: "hsl(var(--sidebar-background))",
        width: collapsed ? "3.5rem" : "15rem",
        transition: "width 200ms ease",
        flexShrink: 0,
      }}
    >
      <SidebarContent className="gap-0">
        {/* Logo area */}
        <div
          className="flex items-center gap-3 px-4 border-b"
          style={{
            height: "3.5rem",
            borderColor: "hsl(var(--sidebar-border))",
          }}
        >
          <img
            src={elibestLogo}
            alt="Elibest"
            className={`h-5 object-contain transition-all ${collapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"}`}
          />
          {collapsed && (
            <img
              src={elibestLogo}
              alt="Elibest"
              className="h-5 w-5 object-cover object-left"
            />
          )}
        </div>

        {/* Navigation */}
        <SidebarGroup className="pt-4 px-2">
          {!collapsed && (
            <SidebarGroupLabel
              className="text-[10px] font-semibold uppercase tracking-widest mb-1 px-2"
              style={{ color: "hsl(var(--sidebar-foreground) / 0.45)" }}
            >
              Management
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {items.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={[
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                          active
                            ? "nav-active text-sidebar-primary"
                            : "text-[hsl(var(--sidebar-foreground))] hover:bg-sidebar-accent/10 hover:text-sidebar-accent",
                        ].join(" ")}
                      >
                        <item.icon
                          className={[
                            "shrink-0 h-4 w-4 transition-colors",
                            active ? "text-primary" : "opacity-60",
                          ].join(" ")}
                        />
                        {!collapsed && (
                          <div className="flex flex-col leading-none">
                            <span>{item.title}</span>
                            {!active && (
                              <span className="text-[10px] opacity-40 font-normal mt-0.5">
                                {item.desc}
                              </span>
                            )}
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter
        className="px-2 pb-3 border-t"
        style={{ borderColor: "hsl(var(--sidebar-border))" }}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 hover:bg-destructive/15 hover:text-destructive text-[hsl(var(--sidebar-foreground))] w-full"
            >
              <LogOut className="shrink-0 h-4 w-4 opacity-60" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
