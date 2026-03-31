import * as z from "zod";
import { differenceInYears } from "date-fns";
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations";

export const employeeSchema = z.object({
  fullName: z.string().min(2, FORM_VALIDATION_MESSAGES.NAME_MIN),
  nationalId: z
    .string()
    .regex(/^(\d{9}|\d{12})$/, FORM_VALIDATION_MESSAGES.ID_FORMAT),
  companyEmail: z.string().email(FORM_VALIDATION_MESSAGES.EMAIL_INVALID),
  phoneNumber: z
    .string()
    .regex(/^\d{10,13}$/, FORM_VALIDATION_MESSAGES.PHONE_FORMAT),
  dateOfBirth: z
    .string()
    .refine(
      (date) => differenceInYears(new Date(), new Date(date)) >= 18,
      FORM_VALIDATION_MESSAGES.AGE_MIN,
    ),
  gender: z.string().optional(),
  address: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  manager: z.string().optional(),
  joinDate: z.string().optional(),
  endDate: z.string().optional(),
  contractType: z.string().optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
