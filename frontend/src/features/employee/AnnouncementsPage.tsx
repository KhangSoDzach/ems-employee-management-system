import { useAuth } from "@/contexts/AuthContext";
import { AnnouncementList } from "./components/AnnouncementList";
import { useSearchParams } from "react-router-dom";

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const focusedAnnouncementId = Number(
    searchParams.get("announcementId") ?? "",
  );

  return (
    <main className="page-layout-wrapper">
      <h1 className="page-heading mb-4">Thông báo Nội bộ</h1>
      <AnnouncementList
        userId={user?.id ?? null}
        focusedAnnouncementId={
          Number.isNaN(focusedAnnouncementId) ? null : focusedAnnouncementId
        }
      />
    </main>
  );
}
