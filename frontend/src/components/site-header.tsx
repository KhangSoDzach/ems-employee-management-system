import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { cn } from "@/lib/utils";

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
} from "@/hooks/useAnnouncements";
import type { AnnouncementResponse } from "@/features/announcement/announcement.types";
import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AnnouncementDetail } from "@/features/announcement/components/AnnouncementDetail";

const formatTime = (value: string) => {
  const date = new Date(value);
  return date.toLocaleString("vi-VN");
};

export function SiteHeader() {
  const { user } = useAuth();
  const { state, isMobile } = useSidebar();
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<AnnouncementResponse | null>(null);
  const { data: announcements = [], isLoading } = useAnnouncements(
    user?.id ?? null,
  );
  const markReadMutation = useMarkAnnouncementRead(user?.id ?? null);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem("notifications_enabled");
    return saved !== "false";
  });

  useEffect(() => {
    localStorage.setItem(
      "notifications_enabled",
      isNotificationsEnabled.toString(),
    );
  }, [isNotificationsEnabled]);

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
        // still show the details
      }
    }
    setNotificationOpen(false);
    setSelectedAnnouncement(announcement);
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-50 flex h-14 shrink-0 items-center justify-between border-b bg-white transition-all duration-200 ease-linear dark:bg-slate-950",
        isMobile
          ? "left-0 w-full"
          : state === "collapsed"
            ? "left-0 w-full"
            : "left-52 w-[calc(100%-13rem)]",
      )}
    >
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
              {isNotificationsEnabled && unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[360px] p-0">
            <div className="border-b px-3 py-2">
              <p className="text-sm font-semibold">
                {SYSTEM_MESSAGES.ANNOUNCEMENT.HEADER_TITLE}
              </p>
            </div>
            <div className="max-h-96 overflow-auto p-2">
              {isLoading && (
                <p className="px-2 py-3 text-sm text-muted-foreground">
                  {SYSTEM_MESSAGES.LOADING_SHORT}
                </p>
              )}

              {!isLoading && topAnnouncements.length === 0 && (
                <p className="px-2 py-3 text-sm text-muted-foreground">
                  {SYSTEM_MESSAGES.ANNOUNCEMENT.NO_NOTIFICATIONS_USER}
                </p>
              )}

              {!isLoading &&
                topAnnouncements.map((announcement: AnnouncementResponse) => (
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
                          {SYSTEM_MESSAGES.ANNOUNCEMENT.NOTIFICATION_BADGE}
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
            <SidebarSettings
              isNotificationsEnabled={isNotificationsEnabled}
              setIsNotificationsEnabled={setIsNotificationsEnabled}
            />
          </PopoverContent>
        </Popover>
      </div>
      <Dialog
        open={selectedAnnouncement !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAnnouncement(null);
          }
        }}
      >
        <DialogContent className="max-w-md p-4">
          <DialogTitle className="sr-only">
            {SYSTEM_MESSAGES.ANNOUNCEMENT.DETAIL_TITLE}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {SYSTEM_MESSAGES.ANNOUNCEMENT.DETAIL_DESC}
          </DialogDescription>
          {selectedAnnouncement && (
            <AnnouncementDetail announcement={selectedAnnouncement} />
          )}
        </DialogContent>
      </Dialog>
    </header>
  );
}
