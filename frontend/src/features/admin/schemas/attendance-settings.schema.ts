import { z } from "zod";
import {
  ATTENDANCE_SETTINGS_CONSTANTS,
  ATTENDANCE_SETTINGS_SCHEMA,
} from "@/constants/attendance-settings";

export const attendanceSettingsSchema = z
  .object({
    shift1CheckIn: z
      .string()
      .min(ATTENDANCE_SETTINGS_SCHEMA.shift1CheckIn.minLength, {
        message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.REQUIRED_FIELD,
      })
      .regex(ATTENDANCE_SETTINGS_SCHEMA.shift1CheckIn.pattern, {
        message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.INVALID_TIME_FORMAT,
      }),
    shift1CheckOut: z
      .string()
      .min(ATTENDANCE_SETTINGS_SCHEMA.shift1CheckOut.minLength, {
        message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.REQUIRED_FIELD,
      })
      .regex(ATTENDANCE_SETTINGS_SCHEMA.shift1CheckOut.pattern, {
        message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.INVALID_TIME_FORMAT,
      }),
    shift2CheckIn: z
      .string()
      .min(ATTENDANCE_SETTINGS_SCHEMA.shift2CheckIn.minLength, {
        message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.REQUIRED_FIELD,
      })
      .regex(ATTENDANCE_SETTINGS_SCHEMA.shift2CheckIn.pattern, {
        message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.INVALID_TIME_FORMAT,
      }),
    shift2CheckOut: z
      .string()
      .min(ATTENDANCE_SETTINGS_SCHEMA.shift2CheckOut.minLength, {
        message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.REQUIRED_FIELD,
      })
      .regex(ATTENDANCE_SETTINGS_SCHEMA.shift2CheckOut.pattern, {
        message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.INVALID_TIME_FORMAT,
      }),
    gracePeriod: z.coerce
      .number()
      .min(ATTENDANCE_SETTINGS_SCHEMA.gracePeriod.min, {
        message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.MUST_BE_NON_NEGATIVE,
      })
      .max(ATTENDANCE_SETTINGS_SCHEMA.gracePeriod.max),
    earlyLeaveThreshold: z.coerce
      .number()
      .min(ATTENDANCE_SETTINGS_SCHEMA.earlyLeaveThreshold.min, {
        message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.MUST_BE_NON_NEGATIVE,
      })
      .max(ATTENDANCE_SETTINGS_SCHEMA.earlyLeaveThreshold.max),
    gpsEnabled: z.boolean(),
    latitude: z
      .string()
      .refine(
        (val) => {
          if (!val) {
            return true;
          }
          const num = parseFloat(val);
          return !isNaN(num);
        },
        {
          message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.DECIMAL_COORDINATE,
        },
      )
      .refine(
        (val) => {
          if (!val) {
            return true;
          }
          const num = parseFloat(val);
          return (
            num >= ATTENDANCE_SETTINGS_SCHEMA.latitude.min &&
            num <= ATTENDANCE_SETTINGS_SCHEMA.latitude.max
          );
        },
        { message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.LATITUDE_RANGE },
      ),
    longitude: z
      .string()
      .refine(
        (val) => {
          if (!val) {
            return true;
          }
          const num = parseFloat(val);
          return !isNaN(num);
        },
        {
          message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.DECIMAL_COORDINATE,
        },
      )
      .refine(
        (val) => {
          if (!val) {
            return true;
          }
          const num = parseFloat(val);
          return (
            num >= ATTENDANCE_SETTINGS_SCHEMA.longitude.min &&
            num <= ATTENDANCE_SETTINGS_SCHEMA.longitude.max
          );
        },
        { message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.LONGITUDE_RANGE },
      ),
    radius: z.coerce
      .number()
      .min(ATTENDANCE_SETTINGS_SCHEMA.radius.min, {
        message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.MUST_BE_POSITIVE,
      })
      .max(ATTENDANCE_SETTINGS_SCHEMA.radius.max, {
        message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.RADIUS_RANGE,
      }),
    locationAction: z.enum(["BLOCK", "NOTIFY", "WARN"]),
  })
  .refine(
    (data) => {
      const inParts = data.shift1CheckIn.split(":").map(Number);
      const outParts = data.shift1CheckOut.split(":").map(Number);
      const inMins = (inParts[0] ?? 0) * 60 + (inParts[1] ?? 0);
      const outMins = (outParts[0] ?? 0) * 60 + (outParts[1] ?? 0);
      return outMins > inMins;
    },
    {
      message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.SHIFT_END_BEFORE_START,
      path: ["shift1CheckOut"],
    },
  )
  .refine(
    (data) => {
      const inParts = data.shift2CheckIn.split(":").map(Number);
      const outParts = data.shift2CheckOut.split(":").map(Number);
      const inMins = (inParts[0] ?? 0) * 60 + (inParts[1] ?? 0);
      const outMins = (outParts[0] ?? 0) * 60 + (outParts[1] ?? 0);
      return outMins > inMins;
    },
    {
      message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.SHIFT_END_BEFORE_START,
      path: ["shift2CheckOut"],
    },
  )
  .refine(
    (data) => {
      const out1Parts = data.shift1CheckOut.split(":").map(Number);
      const in2Parts = data.shift2CheckIn.split(":").map(Number);
      const out1Mins = (out1Parts[0] ?? 0) * 60 + (out1Parts[1] ?? 0);
      const in2Mins = (in2Parts[0] ?? 0) * 60 + (in2Parts[1] ?? 0);
      return in2Mins >= out1Mins;
    },
    {
      message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.SHIFT_OVERLAP,
      path: ["shift2CheckIn"],
    },
  );

export const branchLocationSchema = z.object({
  name: z
    .string()
    .min(
      1,
      ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.BRANCH_LOCATIONS
        .TOAST_PLEASE_ENTER_NAME,
    ),
  address: z.string().optional(),
  latitude: z.coerce
    .number()
    .min(
      ATTENDANCE_SETTINGS_SCHEMA.latitude.min,
      ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.INVALID_COORDINATE,
    )
    .max(
      ATTENDANCE_SETTINGS_SCHEMA.latitude.max,
      ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.INVALID_COORDINATE,
    ),
  longitude: z.coerce
    .number()
    .min(
      ATTENDANCE_SETTINGS_SCHEMA.longitude.min,
      ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.INVALID_COORDINATE,
    )
    .max(
      ATTENDANCE_SETTINGS_SCHEMA.longitude.max,
      ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.INVALID_COORDINATE,
    ),
  radiusMeters: z.coerce
    .number()
    .min(
      ATTENDANCE_SETTINGS_SCHEMA.radius.min,
      ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.RADIUS_RANGE,
    )
    .max(
      ATTENDANCE_SETTINGS_SCHEMA.radius.max,
      ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.RADIUS_RANGE,
    ),
  isActive: z.boolean(),
});

export type AttendanceSettingsFormInput = z.input<
  typeof attendanceSettingsSchema
>;
export type AttendanceSettingsFormValues = z.output<
  typeof attendanceSettingsSchema
>;
