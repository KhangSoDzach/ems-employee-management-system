// src/features/admin/AttendanceSettings.tsx

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Clock, MapPin, Save } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  ATTENDANCE_SETTINGS_CONSTANTS,
  LOCATION_ACTION_OPTIONS,
  ATTENDANCE_SETTINGS_SCHEMA,
} from "@/constants/attendance-settings";

const attendanceSettingsSchema = z.object({
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

type AttendanceSettingsFormInput = z.input<typeof attendanceSettingsSchema>;
type AttendanceSettingsFormValues = z.output<typeof attendanceSettingsSchema>;

const mockApiSubmit = async (
  _data: AttendanceSettingsFormValues,
): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      const hasPermission = true;
      if (!hasPermission) {
        reject(new Error("403"));
      } else {
        resolve();
      }
    }, 1000);
  });
};

export default function AttendanceSettings() {
  const effectiveRole = useEffectiveRole();

  const form = useForm<
    AttendanceSettingsFormInput,
    unknown,
    AttendanceSettingsFormValues
  >({
    resolver: zodResolver(attendanceSettingsSchema),
    mode: "onChange",
    defaultValues: {
      shift1CheckIn: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.SHIFT_1_CHECK_IN,
      shift1CheckOut: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.SHIFT_1_CHECK_OUT,
      shift2CheckIn: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.SHIFT_2_CHECK_IN,
      shift2CheckOut: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.SHIFT_2_CHECK_OUT,
      gracePeriod: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.GRACE_PERIOD,
      earlyLeaveThreshold:
        ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.EARLY_LEAVE_THRESHOLD,
      gpsEnabled: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.GPS_ENABLED,
      latitude: "",
      longitude: "",
      radius: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.RADIUS,
      locationAction: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS
        .ACTION_ON_MISMATCH as "BLOCK" | "NOTIFY" | "WARN",
    },
  });

  const onSubmit = async (data: AttendanceSettingsFormValues) => {
    const loadingToastId = toast.loading(
      ATTENDANCE_SETTINGS_CONSTANTS.TOAST.LOADING,
    );

    try {
      await mockApiSubmit(data);
      toast.dismiss(loadingToastId);
      toast.success(ATTENDANCE_SETTINGS_CONSTANTS.TOAST.SUCCESS_TITLE, {
        description: ATTENDANCE_SETTINGS_CONSTANTS.TOAST.SUCCESS_DESC,
      });
    } catch (error) {
      toast.dismiss(loadingToastId);
      if (error instanceof Error && error.message === "403") {
        toast.error(ATTENDANCE_SETTINGS_CONSTANTS.TOAST.ERROR_FORBIDDEN, {
          description: ATTENDANCE_SETTINGS_CONSTANTS.TOAST.ERROR_DESC,
        });
      } else {
        toast.error(ATTENDANCE_SETTINGS_CONSTANTS.TOAST.ERROR_TITLE, {
          description: ATTENDANCE_SETTINGS_CONSTANTS.TOAST.ERROR_DESC,
        });
      }
    }
  };

  const handleReset = () => {
    form.reset({
      shift1CheckIn: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.SHIFT_1_CHECK_IN,
      shift1CheckOut: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.SHIFT_1_CHECK_OUT,
      shift2CheckIn: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.SHIFT_2_CHECK_IN,
      shift2CheckOut: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.SHIFT_2_CHECK_OUT,
      gracePeriod: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.GRACE_PERIOD,
      earlyLeaveThreshold:
        ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.EARLY_LEAVE_THRESHOLD,
      gpsEnabled: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.GPS_ENABLED,
      latitude: "",
      longitude: "",
      radius: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.RADIUS,
      locationAction: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS
        .ACTION_ON_MISMATCH as "BLOCK" | "NOTIFY" | "WARN",
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" role={effectiveRole} />

      <SidebarInset>
        <SiteHeader />

        <main className="flex flex-1 flex-col p-6 gap-6 bg-gray-50 dark:bg-gray-950">
          <div className="page-header">
            <div>
              <h1 className="page-title">
                {ATTENDANCE_SETTINGS_CONSTANTS.PAGE.TITLE}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {ATTENDANCE_SETTINGS_CONSTANTS.PAGE.DESCRIPTION}
              </p>
            </div>
            <div className="page-header-actions">
              <Button variant="outline" onClick={handleReset}>
                {ATTENDANCE_SETTINGS_CONSTANTS.BUTTONS.RESET}
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)}>
                <Save className="mr-2 h-4 w-4" />
                {ATTENDANCE_SETTINGS_CONSTANTS.BUTTONS.SAVE}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="time" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="time" className="gap-2">
                <Clock className="h-4 w-4" />
                {ATTENDANCE_SETTINGS_CONSTANTS.TABS.TIME_RULES}
              </TabsTrigger>
              <TabsTrigger value="location" className="gap-2">
                <MapPin className="h-4 w-4" />
                {ATTENDANCE_SETTINGS_CONSTANTS.TABS.LOCATION_RULES}
              </TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <TabsContent value="time" className="mt-6">
                  <Card className="settings-card">
                    <CardHeader className="settings-card-header">
                      <div className="flex items-center gap-3">
                        <div className="icon-box-sm bg-primary/10">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="settings-card-title">
                            {
                              ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                                .SECTION_TITLE
                            }
                          </CardTitle>
                          <CardDescription className="settings-card-desc">
                            {
                              ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                                .SECTION_DESC
                            }
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="settings-card-content">
                      <div className="settings-form-grid">
                        {/* Ca 1 */}
                        <div className="settings-form-grid-full">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                              1
                            </span>
                            <span className="font-medium text-foreground">
                              {
                                ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_1
                                  .LABEL
                              }
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="shift1CheckIn"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="setting-label">
                                    {
                                      ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                                        .SHIFT_1.CHECK_IN.LABEL
                                    }
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="time"
                                      {...field}
                                      className="form-input"
                                    />
                                  </FormControl>
                                  <FormDescription className="setting-description">
                                    {
                                      ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                                        .SHIFT_1.CHECK_IN.DESCRIPTION
                                    }
                                  </FormDescription>
                                  <FormMessage className="text-xs font-medium" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="shift1CheckOut"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="setting-label">
                                    {
                                      ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                                        .SHIFT_1.CHECK_OUT.LABEL
                                    }
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="time"
                                      {...field}
                                      className="form-input"
                                    />
                                  </FormControl>
                                  <FormDescription className="setting-description">
                                    {
                                      ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                                        .SHIFT_1.CHECK_OUT.DESCRIPTION
                                    }
                                  </FormDescription>
                                  <FormMessage className="text-xs font-medium" />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Ca 2 */}
                        <div className="settings-form-grid-full">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                              2
                            </span>
                            <span className="font-medium text-foreground">
                              {
                                ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_2
                                  .LABEL
                              }
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="shift2CheckIn"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="setting-label">
                                    {
                                      ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                                        .SHIFT_2.CHECK_IN.LABEL
                                    }
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="time"
                                      {...field}
                                      className="form-input"
                                    />
                                  </FormControl>
                                  <FormDescription className="setting-description">
                                    {
                                      ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                                        .SHIFT_2.CHECK_IN.DESCRIPTION
                                    }
                                  </FormDescription>
                                  <FormMessage className="text-xs font-medium" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="shift2CheckOut"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="setting-label">
                                    {
                                      ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                                        .SHIFT_2.CHECK_OUT.LABEL
                                    }
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="time"
                                      {...field}
                                      className="form-input"
                                    />
                                  </FormControl>
                                  <FormDescription className="setting-description">
                                    {
                                      ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                                        .SHIFT_2.CHECK_OUT.DESCRIPTION
                                    }
                                  </FormDescription>
                                  <FormMessage className="text-xs font-medium" />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="gracePeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="setting-label">
                                {
                                  ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                                    .GRACE_PERIOD.LABEL
                                }
                              </FormLabel>
                              <FormControl>
                                <div className="setting-input-row">
                                  <Input
                                    type="number"
                                    name={field.name}
                                    ref={field.ref}
                                    onBlur={field.onBlur}
                                    value={
                                      typeof field.value === "number"
                                        ? field.value
                                        : 0
                                    }
                                    onChange={(event) => {
                                      const value = Number(event.target.value);
                                      field.onChange(
                                        Number.isNaN(value) ? 0 : value,
                                      );
                                    }}
                                    className="form-input w-full"
                                    placeholder={
                                      ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                                        .GRACE_PERIOD.PLACEHOLDER
                                    }
                                    min={0}
                                  />
                                  <span className="setting-suffix">
                                    {
                                      ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                                        .GRACE_PERIOD.SUFFIX
                                    }
                                  </span>
                                </div>
                              </FormControl>
                              <FormDescription className="setting-description">
                                {
                                  ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                                    .GRACE_PERIOD.DESCRIPTION
                                }
                              </FormDescription>
                              <FormMessage className="text-xs font-medium" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="earlyLeaveThreshold"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="setting-label">
                                {
                                  ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                                    .EARLY_LEAVE_THRESHOLD.LABEL
                                }
                              </FormLabel>
                              <FormControl>
                                <div className="setting-input-row">
                                  <Input
                                    type="number"
                                    name={field.name}
                                    ref={field.ref}
                                    onBlur={field.onBlur}
                                    value={
                                      typeof field.value === "number"
                                        ? field.value
                                        : 0
                                    }
                                    onChange={(event) => {
                                      const value = Number(event.target.value);
                                      field.onChange(
                                        Number.isNaN(value) ? 0 : value,
                                      );
                                    }}
                                    className="form-input w-full"
                                    placeholder={
                                      ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                                        .EARLY_LEAVE_THRESHOLD.PLACEHOLDER
                                    }
                                    min={0}
                                  />
                                  <span className="setting-suffix">
                                    {
                                      ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                                        .EARLY_LEAVE_THRESHOLD.SUFFIX
                                    }
                                  </span>
                                </div>
                              </FormControl>
                              <FormDescription className="setting-description">
                                {
                                  ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                                    .EARLY_LEAVE_THRESHOLD.DESCRIPTION
                                }
                              </FormDescription>
                              <FormMessage className="text-xs font-medium" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="location" className="mt-6">
                  <Card className="settings-card">
                    <CardHeader className="settings-card-header">
                      <div className="flex items-center gap-3">
                        <div className="icon-box-sm bg-primary/10">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="settings-card-title">
                            {
                              ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                .SECTION_TITLE
                            }
                          </CardTitle>
                          <CardDescription className="settings-card-desc">
                            {
                              ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                .SECTION_DESC
                            }
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="settings-card-content">
                      <div className="settings-form-grid">
                        <FormField
                          control={form.control}
                          name="gpsEnabled"
                          render={({ field }) => (
                            <FormItem className="settings-form-grid-full">
                              <div className="setting-toggle-row">
                                <div className="setting-toggle-info">
                                  <FormLabel className="setting-toggle-label">
                                    {
                                      ATTENDANCE_SETTINGS_CONSTANTS
                                        .LOCATION_RULES.GPS_ENABLED.LABEL
                                    }
                                  </FormLabel>
                                  <FormDescription className="setting-toggle-desc">
                                    {field.value
                                      ? ATTENDANCE_SETTINGS_CONSTANTS
                                          .LOCATION_RULES.GPS_ENABLED.ENABLED
                                      : ATTENDANCE_SETTINGS_CONSTANTS
                                          .LOCATION_RULES.GPS_ENABLED.DISABLED}
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </div>
                              <FormDescription className="setting-description mt-2">
                                {
                                  ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                    .GPS_ENABLED.DESCRIPTION
                                }
                              </FormDescription>
                              <FormMessage className="text-xs font-medium" />
                            </FormItem>
                          )}
                        />

                        <div className="settings-form-grid-full settings-grid-coords">
                          <FormField
                            control={form.control}
                            name="latitude"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="setting-label">
                                  {
                                    ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                      .COORDINATES.LATITUDE.LABEL
                                  }
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="form-input form-input-mono"
                                    placeholder={
                                      ATTENDANCE_SETTINGS_CONSTANTS
                                        .LOCATION_RULES.COORDINATES.LATITUDE
                                        .PLACEHOLDER
                                    }
                                    disabled={!form.watch("gpsEnabled")}
                                  />
                                </FormControl>
                                <FormDescription className="setting-description">
                                  {
                                    ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                      .COORDINATES.LATITUDE.DESCRIPTION
                                  }
                                </FormDescription>
                                <FormMessage className="text-xs font-medium" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="longitude"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="setting-label">
                                  {
                                    ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                      .COORDINATES.LONGITUDE.LABEL
                                  }
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="form-input form-input-mono"
                                    placeholder={
                                      ATTENDANCE_SETTINGS_CONSTANTS
                                        .LOCATION_RULES.COORDINATES.LONGITUDE
                                        .PLACEHOLDER
                                    }
                                    disabled={!form.watch("gpsEnabled")}
                                  />
                                </FormControl>
                                <FormDescription className="setting-description">
                                  {
                                    ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                      .COORDINATES.LONGITUDE.DESCRIPTION
                                  }
                                </FormDescription>
                                <FormMessage className="text-xs font-medium" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="radius"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="setting-label">
                                {
                                  ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                    .RADIUS.LABEL
                                }
                              </FormLabel>
                              <FormControl>
                                <div className="setting-input-row">
                                  <Input
                                    type="number"
                                    name={field.name}
                                    ref={field.ref}
                                    onBlur={field.onBlur}
                                    value={
                                      typeof field.value === "number"
                                        ? field.value
                                        : 0
                                    }
                                    onChange={(event) => {
                                      const value = Number(event.target.value);
                                      field.onChange(
                                        Number.isNaN(value) ? 0 : value,
                                      );
                                    }}
                                    className="form-input w-full"
                                    placeholder={
                                      ATTENDANCE_SETTINGS_CONSTANTS
                                        .LOCATION_RULES.RADIUS.PLACEHOLDER
                                    }
                                    min={1}
                                    disabled={!form.watch("gpsEnabled")}
                                  />
                                  <span className="setting-suffix">
                                    {
                                      ATTENDANCE_SETTINGS_CONSTANTS
                                        .LOCATION_RULES.RADIUS.SUFFIX
                                    }
                                  </span>
                                </div>
                              </FormControl>
                              <FormDescription className="setting-description">
                                {
                                  ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                    .RADIUS.DESCRIPTION
                                }
                              </FormDescription>
                              <FormMessage className="text-xs font-medium" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="locationAction"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="setting-label">
                                {
                                  ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                    .ACTION_ON_MISMATCH.LABEL
                                }
                              </FormLabel>
                              <FormControl>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  disabled={!form.watch("gpsEnabled")}
                                >
                                  <SelectTrigger className="form-select">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {LOCATION_ACTION_OPTIONS.map((option) => (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormDescription className="setting-description">
                                {
                                  ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                    .ACTION_ON_MISMATCH.DESCRIPTION
                                }
                              </FormDescription>
                              <FormMessage className="text-xs font-medium" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <div className="settings-actions">
                  <Button type="button" variant="outline" onClick={handleReset}>
                    {ATTENDANCE_SETTINGS_CONSTANTS.BUTTONS.CANCEL}
                  </Button>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    {ATTENDANCE_SETTINGS_CONSTANTS.BUTTONS.SAVE}
                  </Button>
                </div>
              </form>
            </Form>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
