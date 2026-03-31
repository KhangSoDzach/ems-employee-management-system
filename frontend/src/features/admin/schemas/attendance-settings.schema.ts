import { z } from "zod";
import {
  ATTENDANCE_SETTINGS_CONSTANTS,
  ATTENDANCE_SETTINGS_SCHEMA,
} from "@/constants/attendance-settings";

export const attendanceSettingsSchema = z.object({
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
      { message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.DECIMAL_COORDINATE },
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
      { message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.DECIMAL_COORDINATE },
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
});

export type AttendanceSettingsFormInput = z.input<
  typeof attendanceSettingsSchema
>;
export type AttendanceSettingsFormValues = z.output<
  typeof attendanceSettingsSchema
>;
