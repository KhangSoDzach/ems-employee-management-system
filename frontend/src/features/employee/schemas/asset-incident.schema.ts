import * as z from "zod";
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations";

export const assetIncidentSchema = z.object({
  assetId: z.string().min(1, FORM_VALIDATION_MESSAGES.REQUIRED),
  incidentType: z.string().min(1, FORM_VALIDATION_MESSAGES.REQUIRED),
  severity: z.string().min(1, FORM_VALIDATION_MESSAGES.REQUIRED),
  description: z
    .string()
    .min(10, FORM_VALIDATION_MESSAGES.MIN_LENGTH(10))
    .max(500, FORM_VALIDATION_MESSAGES.MAX_LENGTH(500)),
  contactMethod: z.string().optional(),
});

export type AssetIncidentValues = z.infer<typeof assetIncidentSchema>;
