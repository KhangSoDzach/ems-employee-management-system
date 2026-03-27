import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { CreateAnnouncementForm } from "@/features/admin/components/CreateAnnouncementForm";
import { Navigate } from "react-router-dom";

export default function AnnouncementManagementPage() {
  const role = useEffectiveRole();

  if (role !== "admin") {
    return <Navigate to="/announcements" replace />;
  }

  return (
    <main className="page-layout-wrapper">
      <h1 className="page-heading mb-4">Quáº£n lÃ½ ThÃ´ng bÃ¡o Ná»™i bá»™</h1>
      <CreateAnnouncementForm />
    </main>
  );
}
