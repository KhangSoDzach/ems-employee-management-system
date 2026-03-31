import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Bell } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  useAnnouncements,
  useMarkAnnouncementRead,
} from "@/hooks/useAnnouncements";
import type { AnnouncementResponse } from "@/features/announcement/announcement.types";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { AnnouncementDetail } from "@/features/announcement/components/AnnouncementDetail";

const TYPE_LABEL: Record<string, string> = {
  POLICY: SYSTEM_MESSAGES.ANNOUNCEMENT.TYPE_LABEL.POLICY,
  EVENT: SYSTEM_MESSAGES.ANNOUNCEMENT.TYPE_LABEL.EVENT,
  OTHER: SYSTEM_MESSAGES.ANNOUNCEMENT.TYPE_LABEL.OTHER,
};

interface AnnouncementListProps {
  userId: number | null;
  focusedAnnouncementId?: number | null;
}

export function AnnouncementList({
  userId,
  focusedAnnouncementId = null,
}: Readonly<AnnouncementListProps>) {
  const { data, isLoading } = useAnnouncements(userId);
  const markReadMutation = useMarkAnnouncementRead(userId);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<AnnouncementResponse | null>(null);

  const focusedAnnouncement = useMemo(
    () => data?.find((item) => item.id === focusedAnnouncementId) ?? null,
    [data, focusedAnnouncementId],
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
          : SYSTEM_MESSAGES.ANNOUNCEMENT.UPDATE_READ_STATUS_ERROR,
      );
    }
  };

  const handleOpenDetail = async (announcement: AnnouncementResponse) => {
    setSelectedAnnouncement(announcement);
    await handleMarkRead(announcement.id, announcement.isRead);
  };

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        {SYSTEM_MESSAGES.ANNOUNCEMENT.LOADING_NOTIFICATIONS}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {SYSTEM_MESSAGES.ANNOUNCEMENT.NO_NOTIFICATIONS}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((announcement) => (
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
            !announcement.isRead && "border-primary/50 bg-primary/5",
            focusedAnnouncementId === announcement.id &&
              "ring-2 ring-primary/40",
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle
                className={cn("text-base", !announcement.isRead && "font-bold")}
              >
                <span className="font-bold text-primary">
                  {SYSTEM_MESSAGES.ANNOUNCEMENT.NOTIFICATION_PREFIX}
                </span>
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
                    {SYSTEM_MESSAGES.ANNOUNCEMENT.STATUS_UNREAD}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(announcement.publishedAt), "dd/MM/yyyy HH:mm")}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="line-clamp-2 whitespace-pre-wrap text-sm text-foreground/90">
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
                {announcement.isRead
                  ? SYSTEM_MESSAGES.ANNOUNCEMENT.STATUS_READ
                  : SYSTEM_MESSAGES.ANNOUNCEMENT.MARK_READ}
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
        <DialogContent className="max-w-md p-4">
          {selectedAnnouncement && (
            <AnnouncementDetail announcement={selectedAnnouncement} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
