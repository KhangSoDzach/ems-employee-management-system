import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
export function AppLayout() {
  return (
    <SidebarProvider className="h-screen overflow-hidden">
      <AppSidebar variant="inset" />
      <SidebarInset className="h-screen overflow-hidden">
        <SiteHeader />
        <div className="flex-1 overflow-y-auto pt-14 hide-scrollbar">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
