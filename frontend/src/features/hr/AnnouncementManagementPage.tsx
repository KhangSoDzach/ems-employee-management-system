import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { CreateAnnouncementForm } from "@/features/admin/components/CreateAnnouncementForm";
import { Navigate } from "react-router-dom";
import { SYSTEM_MESSAGES } from "@/constants/messages";

export default function AnnouncementManagementPage() {
  const role = useEffectiveRole();

  if (role !== "admin") {
    return <Navigate to="/announcements" replace />;
  }

  return (
    <main className="page-layout-wrapper">
      <h1 className="page-heading mb-4">
        {SYSTEM_MESSAGES.ANNOUNCEMENT.TITLE_MGMT}
      </h1>
      <CreateAnnouncementForm />
    </main>
  );
}
