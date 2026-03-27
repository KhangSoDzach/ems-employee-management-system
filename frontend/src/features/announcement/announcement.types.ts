export type AnnouncementType = "POLICY" | "EVENT" | "OTHER";
export type TargetAudience = "ALL_COMPANY" | "BY_DEPARTMENT" | "BY_ROLE";

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  announcementType: AnnouncementType;
  targetAudience: TargetAudience;
  targetIds: number[];
  sendEmail?: boolean;
  expiresAt?: string | null;
}

export interface CreateAnnouncementResponse {
  announcementId: number;
  recipientCount: number;
  emailDeliveryRequested?: boolean;
  emailedRecipientCount?: number;
  publishedAt: string;
}

export interface AnnouncementResponse {
  id: number;
  title: string;
  content: string;
  announcementType: AnnouncementType;
  targetAudience: TargetAudience;
  isRead: boolean;
  readAt: string | null;
  publishedAt: string;
  expiresAt?: string | null;
}
