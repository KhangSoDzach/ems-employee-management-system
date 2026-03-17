import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { announcementService } from "@/services/announcementService";
import type { CreateAnnouncementRequest } from "../announcement.types";

const ANNOUNCEMENTS_QUERY_KEY = "announcements";

export function useAnnouncements(userId: number | null) {
  return useQuery({
    queryKey: [ANNOUNCEMENTS_QUERY_KEY, userId],
    queryFn: () =>
      announcementService.getAnnouncementsByUserId(userId as number),
    enabled: userId !== null,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAnnouncementRequest) =>
      announcementService.createAnnouncement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_QUERY_KEY] });
    },
  });
}

export function useMarkAnnouncementRead(userId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (announcementId: number) =>
      announcementService.markAsRead(announcementId, userId as number),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ANNOUNCEMENTS_QUERY_KEY, userId],
      });
    },
  });
}
