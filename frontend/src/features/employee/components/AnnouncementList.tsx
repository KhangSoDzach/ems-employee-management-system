import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Bell } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  useAnnouncements,
  useMarkAnnouncementRead,
} from "@/features/announcement/hooks/useAnnouncements";
import type { AnnouncementResponse } from "@/features/announcement/announcement.types";

interface AnnouncementListProps {
  userId: number | null;
  focusedAnnouncementId?: number | null;
}

const TYPE_LABEL: Record<string, string> = {
  POLICY: "Chính sách",
  EVENT: "Sự kiện",
  OTHER: "Khác",
};

export function AnnouncementList({
  userId,
  focusedAnnouncementId = null,
}: Readonly<AnnouncementListProps>) {
  const { data, isLoading } = useAnnouncements(userId);
  const markReadMutation = useMarkAnnouncementRead(userId);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<AnnouncementResponse | null>(null);

  const sortedAnnouncements = useMemo(() => {
    if (!data) {
      return [];
    }
    return [...data].sort((a, b) => {
      // Prioritize unread
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }
      // Then newest first
      return (
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    });
  }, [data]);

  const focusedAnnouncement = useMemo(
    () =>
      sortedAnnouncements.find((item) => item.id === focusedAnnouncementId) ??
      null,
    [sortedAnnouncements, focusedAnnouncementId],
  );

  useEffect(() => {
    if (!focusedAnnouncement || isLoading) {
      return;
    }

    const element = document.getElementById(
      `announcement-${focusedAnnouncement.id}`,
    );
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setSelectedAnnouncement(focusedAnnouncement);
  }, [focusedAnnouncement, isLoading]);

  const handleMarkRead = async (announcementId: number, isRead: boolean) => {
    if (isRead || userId === null) {
      return;
    }
    try {
      await markReadMutation.mutateAsync(announcementId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái đã đọc",
      );
    }
  };

  const handleOpenDetail = async (announcement: AnnouncementResponse) => {
    setSelectedAnnouncement(announcement);
    await handleMarkRead(announcement.id, announcement.isRead);
  };

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Đang tải thông báo...</div>
    );
  }

  if (sortedAnnouncements.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Không có thông báo nào.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sortedAnnouncements.map((announcement) => (
        <Card
          key={announcement.id}
          id={`announcement-${announcement.id}`}
          role="button"
          tabIndex={0}
          onClick={() => void handleOpenDetail(announcement)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              void handleOpenDetail(announcement);
            }
          }}
          className={cn(
            "cursor-pointer transition-colors",
            !announcement.isRead && "border-primary/50 bg-primary/5 shadow-sm",
            focusedAnnouncementId === announcement.id &&
              "ring-2 ring-primary/40",
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle
                className={cn(
                  "line-clamp-1 break-all text-base",
                  !announcement.isRead && "font-bold",
                )}
              >
                {announcement.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {TYPE_LABEL[announcement.announcementType] ??
                    announcement.announcementType}
                </Badge>
                {!announcement.isRead && (
                  <Badge className="bg-blue-100 text-blue-700">
                    <Bell className="mr-1 h-3.5 w-3.5" />
                    Chưa đọc
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(announcement.publishedAt), "dd/MM/yyyy HH:mm")}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="line-clamp-2 break-all whitespace-pre-wrap text-sm text-foreground/90">
              {announcement.content}
            </p>
            <div>
              <Button
                size="sm"
                variant={announcement.isRead ? "secondary" : "default"}
                disabled={announcement.isRead || markReadMutation.isPending}
                onClick={() =>
                  handleMarkRead(announcement.id, announcement.isRead)
                }
              >
                {announcement.isRead ? "Đã đọc" : "Đánh dấu đã đọc"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog
        open={selectedAnnouncement !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAnnouncement(null);
          }
        }}
      >
        <DialogContent className="max-w-lg p-6">
          {selectedAnnouncement && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="leading-tight">
                  <span className="text-2xl font-extrabold text-primary block mb-1">
                    Thông báo:
                  </span>
                  <span className="text-lg font-bold text-foreground/90">
                    {selectedAnnouncement.title}
                  </span>
                </DialogTitle>
                <DialogDescription className="flex items-center gap-3 pt-1">
                  <Badge variant="secondary" className="font-medium text-xs">
                    {TYPE_LABEL[selectedAnnouncement.announcementType] ??
                      selectedAnnouncement.announcementType}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center font-normal">
                    <Bell className="mr-1.5 h-3.5 w-3.5" />
                    {format(
                      new Date(selectedAnnouncement.publishedAt),
                      "dd/MM/yyyy HH:mm",
                    )}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl border bg-slate-50/50 p-4 dark:bg-slate-900/20">
                <div className="max-h-[450px] overflow-y-auto break-all whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90 pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  {selectedAnnouncement.content}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedAnnouncement(null)}
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
