import * as z from "zod";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations";

export const loginSchema = z.object({
  email: z.string().min(1, SYSTEM_MESSAGES.VALIDATION.EMAIL_REQUIRED),
  password: z.string().min(1, SYSTEM_MESSAGES.VALIDATION.PASSWORD_REQUIRED),
  remember: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const emailSchema = z.object({
  email: z
    .string()
    .min(1, FORM_VALIDATION_MESSAGES.EMAIL_REQUIRED)
    .email(FORM_VALIDATION_MESSAGES.EMAIL_INVALID),
});

export const passwordSchema = z
  .string()
  .min(1, FORM_VALIDATION_MESSAGES.PASSWORD_REQUIRED)
  .min(8, FORM_VALIDATION_MESSAGES.PASSWORD_MIN)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    FORM_VALIDATION_MESSAGES.PASSWORD_COMPLEX,
  );

export const otpAndPasswordSchema = z
  .object({
    otp: z
      .string()
      .min(1, FORM_VALIDATION_MESSAGES.OTP_REQUIRED)
      .length(6, FORM_VALIDATION_MESSAGES.OTP_LENGTH)
      .regex(/^\d+$/, FORM_VALIDATION_MESSAGES.OTP_NUMERIC),
    newPassword: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, FORM_VALIDATION_MESSAGES.CONFIRM_PASSWORD_REQUIRED),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: FORM_VALIDATION_MESSAGES.PASSWORD_MISMATCH,
    path: ["confirmPassword"],
  });

export const profileChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, FORM_VALIDATION_MESSAGES.REQUIRED),
    newPassword: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, FORM_VALIDATION_MESSAGES.CONFIRM_PASSWORD_REQUIRED),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: FORM_VALIDATION_MESSAGES.PASSWORD_MISMATCH,
    path: ["confirmPassword"],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: SYSTEM_MESSAGES.CHANGE_PASSWORD.NEWPASSWORD_DIFFERENT_CURRENT,
    path: ["newPassword"],
  });

export type EmailFormValues = z.infer<typeof emailSchema>;
export type OtpPasswordFormValues = z.infer<typeof otpAndPasswordSchema>;
export type ProfileChangePasswordFormValues = z.infer<
  typeof profileChangePasswordSchema
>;
export type ResetFormValues = OtpPasswordFormValues &
  ProfileChangePasswordFormValues;
