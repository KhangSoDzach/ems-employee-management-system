import { format } from "date-fns";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import type { AnnouncementResponse } from "../announcement.types";

interface AnnouncementDetailProps {
  announcement: AnnouncementResponse;
}

const TYPE_LABEL: Record<string, string> = {
  POLICY: SYSTEM_MESSAGES.ANNOUNCEMENT.TYPE_LABEL.POLICY,
  EVENT: SYSTEM_MESSAGES.ANNOUNCEMENT.TYPE_LABEL.EVENT,
  OTHER: SYSTEM_MESSAGES.ANNOUNCEMENT.TYPE_LABEL.OTHER,
};

export function AnnouncementDetail({ announcement }: AnnouncementDetailProps) {
  const formatTime = (value: string) => {
    try {
      return format(new Date(value), "dd/MM/yyyy HH:mm");
    } catch {
      return value;
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-base">
          <span className="font-bold text-primary">
            {SYSTEM_MESSAGES.ANNOUNCEMENT.NOTIFICATION_PREFIX}
          </span>
          {announcement.title}
        </DialogTitle>
        <DialogDescription>
          <span className="mr-2 inline-flex">
            {TYPE_LABEL[announcement.announcementType] ??
              announcement.announcementType}
          </span>
          <span>{formatTime(announcement.publishedAt)}</span>
        </DialogDescription>
      </DialogHeader>
      <Card className="mt-4 border shadow-sm">
        <CardContent className="max-h-[260px] overflow-auto whitespace-pre-wrap p-4 text-sm text-foreground/90 break-all">
          {announcement.content}
        </CardContent>
      </Card>
    </>
  );
}
