import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SYSTEM_MESSAGES } from "@/constants/messages";

import { Bell, Settings } from "lucide-react";
import SidebarSettings from "@/features/security/SecuritySettings";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAnnouncements,
  useMarkAnnouncementRead,
} from "@/features/announcement/hooks/useAnnouncements";
import type { AnnouncementResponse } from "@/features/announcement/announcement.types";
import { useNavigate } from "react-router-dom";

const formatTime = (value: string) => {
  const date = new Date(value);
  return date.toLocaleString("vi-VN");
};

export function SiteHeader() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: announcements = [], isLoading } = useAnnouncements(
    user?.id ?? null,
  );
  const markReadMutation = useMarkAnnouncementRead(user?.id ?? null);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const unreadCount = useMemo(
    () => announcements.filter((item) => !item.isRead).length,
    [announcements],
  );

  const topAnnouncements = useMemo(
    () => announcements.slice(0, 8),
    [announcements],
  );

  const handleOpenAnnouncement = async (announcement: AnnouncementResponse) => {
    if (user?.id && !announcement.isRead) {
      try {
        await markReadMutation.mutateAsync(announcement.id);
      } catch {
        // still navigate to announcement details
      }
    }
    setNotificationOpen(false);
    navigate(`/announcements?announcementId=${announcement.id}`);
  };

  return (
    <header className="fixed top-0 right-0 left-0 h-14 md:left-52 z-50 w-full md:w-[calc(100%-13rem)] bg-white dark:bg-slate-950 flex shrink-0 items-center justify-between border-b transition-[width,height] ease-linear">
      <div className="flex items-center gap-2 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">
          {SYSTEM_MESSAGES.SIDEBAR.HEADER_TITLE}
        </h1>
      </div>
      <div className="flex items-center gap-4 px-4 lg:px-6">
        <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[360px] p-0">
            <div className="border-b px-3 py-2">
              <p className="text-sm font-semibold">Thông báo</p>
            </div>
            <div className="max-h-96 overflow-auto p-2">
              {isLoading && (
                <p className="px-2 py-3 text-sm text-muted-foreground">
                  Đang tải...
                </p>
              )}

              {!isLoading && topAnnouncements.length === 0 && (
                <p className="px-2 py-3 text-sm text-muted-foreground">
                  Bạn chưa có thông báo nào.
                </p>
              )}

              {!isLoading &&
                topAnnouncements.map((announcement) => (
                  <button
                    key={announcement.id}
                    type="button"
                    onClick={() => void handleOpenAnnouncement(announcement)}
                    className="mb-1 w-full rounded-md border px-3 py-2 text-left hover:bg-muted"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-medium">
                        {announcement.title}
                      </p>
                      {!announcement.isRead && (
                        <Badge className="h-5 bg-blue-100 text-blue-700">
                          Mới
                        </Badge>
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {announcement.content}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatTime(announcement.publishedAt)}
                    </p>
                  </button>
                ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="p-0 border-none shadow-2xl rounded-2xl overflow-hidden w-72"
          >
            <SidebarSettings />
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
