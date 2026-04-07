import * as z from "zod";
import { VALIDATION_MSGS } from "@/constants/adjustment-request";

export const adjustmentSchema = z
  .object({
    adjustmentDate: z.date({ message: VALIDATION_MSGS.dateRequired }),
    type: z.enum(["CHECK_IN", "CHECK_OUT", "BOTH"] as const, {
      message: VALIDATION_MSGS.typeRequired,
    }),
    timeIn: z.string().optional(),
    timeOut: z.string().optional(),
    reason: z
      .string()
      .trim()
      .min(1, VALIDATION_MSGS.reasonRequired)
      .min(10, VALIDATION_MSGS.reasonMinLength)
      .max(2000, VALIDATION_MSGS.reasonMaxLength),
  })
  .refine(
    (d) => (d.type === "CHECK_IN" || d.type === "BOTH" ? !!d.timeIn : true),
    { message: VALIDATION_MSGS.timeInRequired, path: ["timeIn"] },
  )
  .refine(
    (d) => (d.type === "CHECK_OUT" || d.type === "BOTH" ? !!d.timeOut : true),
    { message: VALIDATION_MSGS.timeOutRequired, path: ["timeOut"] },
  );

export type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;
