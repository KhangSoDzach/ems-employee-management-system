import { useEffect, useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { Bell, Check, X } from "lucide-react";
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
import type {
  AnnouncementResponse,
  AnnouncementType,
} from "@/features/announcement/announcement.types";

interface AnnouncementListProps {
  userId: number | null;
  focusedAnnouncementId?: number | null;
}

const TYPE_LABEL: Record<AnnouncementType, string> = {
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
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();

  const sortedAnnouncements = useMemo(() => {
    if (!data) {
      return [];
    }
    return [...data].sort((a, b) => {
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }
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

  useEffect(() => {
    if (data) {
      const readSet = new Set(
        sortedAnnouncements.filter((a) => a.isRead).map((a) => a.id),
      );
      setReadIds((prev) => {
        const newSet = new Set(prev);
        let changed = false;
        readSet.forEach((id) => {
          if (!newSet.has(id)) {
            newSet.add(id);
            changed = true;
          }
        });
        return changed ? newSet : prev;
      });
    }
  }, [data, sortedAnnouncements]);

  const handleMarkRead = async (announcementId: number, isRead: boolean) => {
    if (isRead || userId === null) {
      return;
    }
    startTransition(async () => {
      try {
        await markReadMutation.mutateAsync(announcementId);
        setReadIds((prev) => new Set([...prev, announcementId]));
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không thể cập nhật trạng thái đã đọc",
        );
      }
    });
  };

  const handleOpenDetail = async (announcement: AnnouncementResponse) => {
    setSelectedAnnouncement(announcement);
    if (!announcement.isRead && !readIds.has(announcement.id)) {
      await handleMarkRead(announcement.id, announcement.isRead);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (sortedAnnouncements.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">
            Không có thông báo nào
          </p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Thông báo sẽ xuất hiện ở đây khi có thông báo mới
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sortedAnnouncements.map((announcement) => {
        const isRead = announcement.isRead || readIds.has(announcement.id);

        return (
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
              !isRead && "border-primary/50 bg-primary/5",
              focusedAnnouncementId === announcement.id &&
                "ring-2 ring-primary/40",
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle
                  className={cn(
                    "line-clamp-1 break-all text-base",
                    !isRead && "font-bold",
                  )}
                >
                  <span className="text-primary font-bold text-lg">
                    Thông báo:
                  </span>{" "}
                  {announcement.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {TYPE_LABEL[announcement.announcementType] ??
                      announcement.announcementType}
                  </Badge>
                  {!isRead && (
                    <Badge className="bg-blue-100 text-blue-700">
                      <Bell className="mr-1 h-3.5 w-3.5" />
                      Mới
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
                {isRead ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    Đã đọc
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant={announcement.isRead ? "secondary" : "default"}
                    disabled={announcement.isRead || isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleMarkRead(announcement.id, announcement.isRead);
                    }}
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Đánh dấu đã đọc
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog
        open={selectedAnnouncement !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAnnouncement(null);
          }
        }}
      >
        <DialogContent className="max-w-lg p-0">
          {selectedAnnouncement &&
            (() => {
              const isRead =
                selectedAnnouncement.isRead ||
                readIds.has(selectedAnnouncement.id);

              return (
                <div className="space-y-4">
                  <DialogHeader className="p-6 pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <DialogTitle className="leading-tight text-xl">
                        <span className="text-primary font-bold">
                          Thông báo:
                        </span>{" "}
                        {selectedAnnouncement.title}
                      </DialogTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 -mr-2"
                        onClick={() => setSelectedAnnouncement(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <DialogDescription className="flex items-center gap-3 pt-1">
                      <Badge variant="secondary">
                        {TYPE_LABEL[selectedAnnouncement.announcementType] ??
                          selectedAnnouncement.announcementType}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Bell className="mr-1.5 h-3.5 w-3.5" />
                        {format(
                          new Date(selectedAnnouncement.publishedAt),
                          "dd/MM/yyyy HH:mm",
                        )}
                      </span>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mx-6 mb-6 rounded-xl border bg-slate-50/50 p-4 dark:bg-slate-900/20">
                    <div className="max-h-[350px] overflow-y-auto break-all whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90 pr-2">
                      {selectedAnnouncement.content}
                    </div>
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
