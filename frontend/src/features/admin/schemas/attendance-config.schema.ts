import { z } from "zod";
import { ATTENDANCE_VALIDATION_MESSAGES as MSG } from "../../../constants/attendance-validation";

/**
 * @name BranchLocationSchema
 * @description Validate object cho từng chi nhánh
 */
export const BranchLocationSchema = z.object({
  name: z.string().trim().min(1, MSG.BRANCH_NAME_REQUIRED),
  address: z.string().trim().min(1, MSG.BRANCH_ADDRESS_REQUIRED),
  latitude: z
    .number({
      message: MSG.BRANCH_LATITUDE_INVALID,
    })
    .min(-90, MSG.BRANCH_LATITUDE_INVALID)
    .max(90, MSG.BRANCH_LATITUDE_INVALID),
  longitude: z
    .number({
      message: MSG.BRANCH_LONGITUDE_INVALID,
    })
    .min(-180, MSG.BRANCH_LONGITUDE_INVALID)
    .max(180, MSG.BRANCH_LONGITUDE_INVALID),
  radius: z
    .number({
      message: MSG.BRANCH_RADIUS_INVALID,
    })
    .positive(MSG.BRANCH_RADIUS_INVALID),
  isActive: z.boolean(),
});

/**
 * @name AttendanceConfigSchema
 * @description Main Schema cho Cấu hình chấm công
 */
export const AttendanceConfigSchema = z
  .object({
    // 1. Cấu hình Thời gian (Time Rules)
    shift1Start: z.string().min(1, MSG.SHIFT_1_START_REQUIRED),
    shift1End: z.string().min(1, MSG.SHIFT_1_END_REQUIRED),
    shift2Start: z.string().min(1, MSG.SHIFT_2_START_REQUIRED),
    shift2End: z.string().min(1, MSG.SHIFT_2_END_REQUIRED),
    lateTolerance: z
      .number({
        message: MSG.LATE_TOLERANCE_INVALID,
      })
      .min(0, MSG.LATE_TOLERANCE_INVALID),
    earlyLeaveTolerance: z
      .number({
        message: MSG.EARLY_LEAVE_TOLERANCE_INVALID,
      })
      .min(0, MSG.EARLY_LEAVE_TOLERANCE_INVALID),

    // 2. Cấu hình Vị trí Chính (Main Location Rules)
    gpsEnabled: z.boolean(),
    latitude: z
      .number({
        message: MSG.LATITUDE_INVALID,
      })
      .min(-90, MSG.LATITUDE_INVALID)
      .max(90, MSG.LATITUDE_INVALID),
    longitude: z
      .number({
        message: MSG.LONGITUDE_INVALID,
      })
      .min(-180, MSG.LONGITUDE_INVALID)
      .max(180, MSG.LONGITUDE_INVALID),
    radius: z
      .number({
        message: MSG.RADIUS_INVALID,
      })
      .positive(MSG.RADIUS_INVALID),

    // 3. Cấu hình Vị trí Chi nhánh (Branch Locations)
    branches: z.array(BranchLocationSchema),
  })
  .superRefine((data, ctx) => {
    // Logic Refine: Giờ tan ca 1 > Giờ vào ca 1
    if (data.shift1Start && data.shift1End) {
      if (data.shift1End <= data.shift1Start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: MSG.SHIFT_1_END_AFTER_START,
          path: ["shift1End"],
        });
      }
    }

    // Logic Refine: Giờ tan ca 2 > Giờ vào ca 2
    if (data.shift2Start && data.shift2End) {
      if (data.shift2End <= data.shift2Start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: MSG.SHIFT_2_END_AFTER_START,
          path: ["shift2End"],
        });
      }
    }

    // Logic Refine nâng cao: Giờ vào ca 2 >= Giờ tan ca 1
    if (data.shift1End && data.shift2Start) {
      if (data.shift2Start < data.shift1End) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: MSG.SHIFT_2_START_AFTER_SHIFT_1_END,
          path: ["shift2Start"],
        });
      }
    }
  });

export type AttendanceConfigValues = z.infer<typeof AttendanceConfigSchema>;
