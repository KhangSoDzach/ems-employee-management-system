import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { AnnouncementList } from "./components/AnnouncementList";
import { useSearchParams } from "react-router-dom";

export default function AnnouncementsPage() {
  const role = useEffectiveRole();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const focusedAnnouncementId = Number(
    searchParams.get("announcementId") ?? "",
  );

  return (
    <SidebarProvider>
      <AppSidebar role={role} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="page-layout-wrapper">
          <h1 className="page-heading mb-4">Thông báo Nội bộ</h1>
          <AnnouncementList
            userId={user?.id ?? null}
            focusedAnnouncementId={
              Number.isNaN(focusedAnnouncementId) ? null : focusedAnnouncementId
            }
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
