import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { CreateAnnouncementForm } from "@/features/admin/components/CreateAnnouncementForm";
import { Navigate } from "react-router-dom";
import { SYSTEM_MESSAGES } from "@/constants/messages";

/**
 * @file AnnouncementManagementPage.tsx
 * @description Trang quản lý thông báo nội bộ, cho phép Admin tạo và quản lý các thông báo trong hệ thống.
 * Internal announcement management page, allowing Admins to create and manage system announcements.
 */
export default function AnnouncementManagementPage() {
  // ══════════════ RBAC & LOGIC ══════════════
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
