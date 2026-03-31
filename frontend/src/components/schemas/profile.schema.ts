import * as z from "zod";
import { differenceInYears } from "date-fns";
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations";

export const profileSchema = z.object({
  employeeCode: z.string(),
  fullName: z
    .string()
    .min(2, FORM_VALIDATION_MESSAGES.NAME_MIN)
    .max(255, FORM_VALIDATION_MESSAGES.NAME_MAX),
  nationalId: z
    .string()
    .regex(/^(\d{9}|\d{12})$/, FORM_VALIDATION_MESSAGES.ID_FORMAT),
  companyEmail: z.string().email(FORM_VALIDATION_MESSAGES.EMAIL_INVALID),
  phoneNumber: z
    .string()
    .regex(/^\d{10,13}$/, FORM_VALIDATION_MESSAGES.PHONE_FORMAT)
    .optional()
    .or(z.literal("")),
  dateOfBirth: z
    .date({
      message: FORM_VALIDATION_MESSAGES.DOB_REQUIRED,
    })
    .refine(
      (date) => differenceInYears(new Date(), date) >= 18,
      FORM_VALIDATION_MESSAGES.AGE_MIN,
    ),
  contractType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]),
  startDate: z.date({
    message: FORM_VALIDATION_MESSAGES.START_DATE_REQUIRED,
  }),
  endDate: z.date().optional().nullable(),
  department: z.string().min(1, FORM_VALIDATION_MESSAGES.DEPT_REQUIRED),
  jobRole: z.string().min(1, FORM_VALIDATION_MESSAGES.ROLE_REQUIRED),
  workStatus: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const defaultProfileValues: Partial<ProfileFormValues> = {
  employeeCode: "",
  fullName: "",
  nationalId: "",
  companyEmail: "",
  phoneNumber: "",
  contractType: "FULL_TIME",
  department: "",
  jobRole: "",
  workStatus: "ACTIVE",
};
