import { z } from "zod";
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations";
import { EMPLOYEE_CONSTANTS } from "../employee.constants";

export const employeeSchema = z.object({
  firstName: z.string().min(1, FORM_VALIDATION_MESSAGES.FIRST_NAME_REQUIRED),
  lastName: z.string().min(1, FORM_VALIDATION_MESSAGES.LAST_NAME_REQUIRED),
  email: z
    .string()
    .min(1, FORM_VALIDATION_MESSAGES.EMAIL_REQUIRED)
    .email(FORM_VALIDATION_MESSAGES.EMAIL_INVALID),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{10,13}$/.test(val), {
      message: FORM_VALIDATION_MESSAGES.PHONE_FORMAT,
    }),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  dateOfBirth: z.string().min(1, FORM_VALIDATION_MESSAGES.DOB_REQUIRED),
  hireDate: z.string().min(1, FORM_VALIDATION_MESSAGES.START_DATE_REQUIRED),
  departmentId: z.number().min(1, FORM_VALIDATION_MESSAGES.DEPT_REQUIRED),
  positionId: z.number().min(1, FORM_VALIDATION_MESSAGES.ROLE_REQUIRED),
  salary: z.number().min(1, FORM_VALIDATION_MESSAGES.SALARY_REQUIRED),
  workStatus: z.enum(["PROBATION", "ACTIVE", "TERMINATED"]),
  contractType: z.enum([
    "FULL_TIME",
    "PART_TIME",
    "CONTRACT",
    "INTERN",
    "CONSULTANT",
    "TEMPORARY",
  ]),
  contractStartDate: z.string().optional(),
  contractDurationMonths: z.number().optional(),
  nationalId: z
    .string()
    .min(1, FORM_VALIDATION_MESSAGES.ID_REQUIRED)
    .regex(
      EMPLOYEE_CONSTANTS.VALIDATION.ID_REGEX,
      FORM_VALIDATION_MESSAGES.ID_FORMAT,
    ),
  socialSecurityNumber: z
    .string()
    .min(1, FORM_VALIDATION_MESSAGES.SOCIAL_WARRANTY_NUMBER_REQUIRED)
    .regex(/^\d{10}$/, FORM_VALIDATION_MESSAGES.SOCIAL_WARRANTY_NUMBER_FORMAT),
  address: z.string().min(1, FORM_VALIDATION_MESSAGES.ADDRESS_REQUIRED),
  city: z.string().optional(),
  nationality: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  bankName: z.string().min(1, FORM_VALIDATION_MESSAGES.BANK_NAME_REQUIRED),
  bankAccountNumber: z
    .string()
    .min(1, FORM_VALIDATION_MESSAGES.BANK_ACC_REQUIRED)
    .regex(
      EMPLOYEE_CONSTANTS.VALIDATION.BANK_ACC_REGEX,
      FORM_VALIDATION_MESSAGES.BANK_ACC_FORMAT,
    ),
  avatarUrl: z.string().optional(),
  reportingManagerId: z.number().optional(),
  notes: z.string().optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
