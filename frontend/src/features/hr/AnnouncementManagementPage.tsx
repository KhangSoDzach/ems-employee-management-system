import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { CreateAnnouncementForm } from "@/features/admin/components/CreateAnnouncementForm";
import { Navigate } from "react-router-dom";

export default function AnnouncementManagementPage() {
  const role = useEffectiveRole();

  if (role !== "admin") {
    return <Navigate to="/announcements" replace />;
  }

  return (
    <SidebarProvider>
      <AppSidebar role={role} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="page-layout-wrapper">
          <h1 className="page-heading mb-4">Quản lý Thông báo Nội bộ</h1>
          <CreateAnnouncementForm />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
