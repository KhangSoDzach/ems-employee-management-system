import * as z from "zod";
import { LEAVE_POLICY, VALIDATION_MSGS } from "@/constants/leave-request";

export const leaveSchema = z
  .object({
    leaveType: z.enum(["annual", "sick", "unpaid", "personal"] as const, {
      error: VALIDATION_MSGS.TYPE_REQ,
    }),

    startDate: z
      .date({ error: VALIDATION_MSGS.DATE_REQ })
      .refine(
        (date) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const minDate = new Date(today);
          minDate.setDate(minDate.getDate() + LEAVE_POLICY.MIN_DAYS_BEFORE);

          return date >= minDate;
        },
        {
          message: VALIDATION_MSGS.MIN_DAYS,
        },
      )
      .refine(
        (date) => {
          const day = date.getDay();
          return !LEAVE_POLICY.WEEKEND_DAYS.includes(day);
        },
        {
          message: VALIDATION_MSGS.NO_WEEKEND,
        },
      ),

    endDate: z.date({ error: VALIDATION_MSGS.DATE_REQ }).refine(
      (date) => {
        const day = date.getDay();
        return !LEAVE_POLICY.WEEKEND_DAYS.includes(day);
      },
      {
        message: VALIDATION_MSGS.NO_WEEKEND,
      },
    ),

    reason: z.string().min(5, VALIDATION_MSGS.REASON_REQ),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: VALIDATION_MSGS.START_BEFORE_END,
    path: ["endDate"],
  });

export type LeaveFormValues = z.infer<typeof leaveSchema>;
