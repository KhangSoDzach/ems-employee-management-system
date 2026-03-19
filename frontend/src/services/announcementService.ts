import api from "@/lib/axios";
import type {
  AnnouncementResponse,
  CreateAnnouncementRequest,
  CreateAnnouncementResponse,
} from "@/features/announcement/announcement.types";

type ApiResponse<T> = {
  success?: boolean;
  status?: string;
  message?: string;
  data: T;
};

export const announcementService = {
  createAnnouncement: async (
    payload: CreateAnnouncementRequest,
  ): Promise<CreateAnnouncementResponse> => {
    const response = (await api.post(
      "/announcements",
      payload,
    )) as ApiResponse<CreateAnnouncementResponse>;
    return response.data;
  },

  getAnnouncementsByUserId: async (
    userId: number,
  ): Promise<AnnouncementResponse[]> => {
    const response = (await api.get(
      `/announcements/user/${userId}`,
    )) as ApiResponse<AnnouncementResponse[]>;
    return response.data;
  },

  markAsRead: async (
    announcementId: number,
    userId: number,
  ): Promise<AnnouncementResponse> => {
    const response = (await api.put(`/announcements/${announcementId}/read`, {
      userId,
    })) as ApiResponse<AnnouncementResponse>;
    return response.data;
  },
};
