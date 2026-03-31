import { z } from "zod";
import { SYSTEM_MESSAGES } from "@/constants/messages";

export const announcementFormSchema = z.object({
  title: z
    .string()
    .min(1, SYSTEM_MESSAGES.ANNOUNCEMENT.FORM_TITLE_REQUIRED)
    .max(255, SYSTEM_MESSAGES.ANNOUNCEMENT.FORM_TITLE_MAX),
  content: z
    .string()
    .min(1, SYSTEM_MESSAGES.ANNOUNCEMENT.FORM_CONTENT_REQUIRED),
  announcementType: z.enum(["POLICY", "EVENT", "OTHER"]),
  targetAudience: z.enum(["ALL_COMPANY", "BY_DEPARTMENT", "BY_ROLE"]),
  targetIds: z.array(z.number()),
});

export type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;
