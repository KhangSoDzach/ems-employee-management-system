import { useAuth } from "@/contexts/AuthContext";
import { AnnouncementList } from "./components/AnnouncementList";
import { useSearchParams } from "react-router-dom";
import { SYSTEM_MESSAGES } from "@/constants/messages";

/**
 * AnnouncementsPage Component
 * Displays internal company communications and updates to employees.
 *
 * Capabilities:
 * - Real-time Feed: View and browse the latest company-wide announcements.
 * - Targeted Notifications: Support for deep-linking to specific announcements via URL parameters.
 * - High-Impact Communication: Ensures clear dissemination of organizational news and events.
 */
export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const focusedAnnouncementId = Number(
    searchParams.get("announcementId") ?? "",
  );

  return (
    <main className="page-layout-wrapper">
      <h1 className="page-heading mb-4">
        {SYSTEM_MESSAGES.ANNOUNCEMENT.TITLE}
      </h1>
      <AnnouncementList
        userId={user?.id ?? null}
        focusedAnnouncementId={
          Number.isNaN(focusedAnnouncementId) ? null : focusedAnnouncementId
        }
      />
    </main>
  );
}
