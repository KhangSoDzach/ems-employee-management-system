import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { CreateAnnouncementForm } from "@/features/admin/components/CreateAnnouncementForm";
import { Navigate } from "react-router-dom";
import { SYSTEM_MESSAGES } from "@/constants/messages";

/**
 * AnnouncementManagementPage Component
 * Administrative interface for creating and publishing internal company communications.
 *
 * Capabilities:
 * - Content Creation: Compose and format internal announcements for all employees.
 * - Distribution Control: Manage the visibility and publication status of notifications.
 * - RBAC Enforcement: Strict access control ensuring only authorized personnel can post updates.
 */
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
