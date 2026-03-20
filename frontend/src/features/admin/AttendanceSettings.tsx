// src/features/admin/AttendanceSettings.tsx

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Clock, MapPin, Save, Shield, Settings2, Sparkles, RefreshCcw, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { cn } from "@/lib/utils";

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
})
.refine((data) => data.shift1CheckOut > data.shift1CheckIn, {
  message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.SHIFT_END_BEFORE_START,
  path: ["shift1CheckOut"],
})
.refine((data) => data.shift2CheckIn > data.shift1CheckOut, {
  message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.SHIFT_OVERLAP,
  path: ["shift2CheckIn"],
})
.refine((data) => data.shift2CheckOut > data.shift2CheckIn, {
  message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.SHIFT_END_BEFORE_START,
  path: ["shift2CheckOut"],
});

type AttendanceSettingsFormValues = z.infer<typeof attendanceSettingsSchema>;

const MOCK_SUBMIT_DELAY = 1200;

export default function AttendanceSettings() {
  const effectiveRole = useEffectiveRole();
  const [activeTab, setActiveTab] = React.useState("time");

  const form = useForm<AttendanceSettingsFormValues>({
    resolver: zodResolver(attendanceSettingsSchema) as any,
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

  const gpsEnabled = form.watch("gpsEnabled");

  const onSubmit = async (_data: AttendanceSettingsFormValues) => {
    const loadingToastId = toast.loading(
      ATTENDANCE_SETTINGS_CONSTANTS.TOAST.LOADING,
    );

    // Simulated API call
    console.log("Submitting settings:", _data);
    try {
      await new Promise((resolve) => setTimeout(resolve, MOCK_SUBMIT_DELAY));
      toast.dismiss(loadingToastId);
      toast.success(ATTENDANCE_SETTINGS_CONSTANTS.TOAST.SUCCESS_TITLE, {
        description: ATTENDANCE_SETTINGS_CONSTANTS.TOAST.SUCCESS_DESC,
      });
    } catch {
      toast.dismiss(loadingToastId);
      toast.error(ATTENDANCE_SETTINGS_CONSTANTS.TOAST.ERROR_TITLE, {
        description: ATTENDANCE_SETTINGS_CONSTANTS.TOAST.ERROR_DESC,
      });
    }
  };

  const handleReset = () => {
    form.reset();
    toast.info("Đã đặt lại cấu hình mặc định");
  };

  return (
    <SidebarProvider>
      <AppSidebar variant={"inset"} role={effectiveRole} />

      <SidebarInset className={"bg-slate-50/50 dark:bg-slate-950"}>
        <SiteHeader />

        <main className={"flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full relative z-0"}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className={"flex flex-col gap-8"}>
              {/* Premium Hero Banner */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={"relative overflow-hidden rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl bg-white dark:bg-slate-900 group"}
              >
                <div className={"absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700 pointer-events-none"} />
                <div className={"absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/15 transition-colors duration-700 pointer-events-none"} />
                
                <div className={"relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6"}>
                  <div className={"space-y-3"}>
                    <div className={"flex items-center gap-2"}>
                      <span className={"px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"}>
                        <Sparkles className={"w-3 h-3"} />
                        {ATTENDANCE_SETTINGS_CONSTANTS.PAGE.SYSTEM_CONFIG}
                      </span>
                    </div>
                    <h1 className={"text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white"}>
                      {ATTENDANCE_SETTINGS_CONSTANTS.PAGE.TITLE}
                    </h1>
                    <p className={"text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed"}>
                      {ATTENDANCE_SETTINGS_CONSTANTS.PAGE.DESCRIPTION}
                    </p>
                  </div>
                  
                  <div className={"flex items-center gap-3 shrink-0"}>
                    <Button 
                      variant={"ghost"} 
                      type={"button"}
                      onClick={handleReset}
                      className={"h-14 px-6 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-slate-600 dark:text-slate-300"}
                    >
                      <RefreshCcw className={"mr-2 h-4 w-4"} />
                      {ATTENDANCE_SETTINGS_CONSTANTS.BUTTONS.RESET}
                    </Button>
                    <Button 
                      type={"submit"}
                      className={"h-14 px-8 rounded-2xl gradient-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold group"}
                    >
                      <Save className={"mr-2 h-5 w-5 group-hover:rotate-12 transition-transform"} />
                      {ATTENDANCE_SETTINGS_CONSTANTS.BUTTONS.SAVE}
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Navigation Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className={"w-full space-y-8"}>
                <div className={"flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-30"}>
                  <TabsList className={"h-14 p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 self-start"}>
                    <TabsTrigger 
                      value={"time"} 
                      className={"h-full px-8 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all text-slate-500 gap-2"}
                    >
                      <Clock className={"h-4 w-4"} />
                      {ATTENDANCE_SETTINGS_CONSTANTS.TABS.TIME_RULES}
                    </TabsTrigger>
                    <TabsTrigger 
                      value={"location"} 
                      className={"h-full px-8 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all text-slate-500 gap-2"}
                    >
                      <MapPin className={"h-4 w-4"} />
                      {ATTENDANCE_SETTINGS_CONSTANTS.TABS.LOCATION_RULES}
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className={"flex items-center gap-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/30 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 shrink-0"}>
                    <span className={"flex items-center gap-1.5"}><Shield className={"w-3.5 h-3.5 text-blue-500"} /> {ATTENDANCE_SETTINGS_CONSTANTS.PAGE.SECURITY_HIGH}</span>
                    <div className={"w-px h-3 bg-slate-200 dark:bg-slate-800"} />
                    <span className={"flex items-center gap-1.5"}><Settings2 className={"w-3.5 h-3.5 text-emerald-500"} /> {ATTENDANCE_SETTINGS_CONSTANTS.PAGE.CONFIG_ACTIVE}</span>
                  </div>
                </div>

                <div className={"relative min-h-[500px]"}>
                    {/* Time Rules Tab Content */}
                    <TabsContent key={"time-pane"} value={"time"} className={"mt-0 focus-visible:ring-0 data-[state=inactive]:hidden"}>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className={"grid grid-cols-1 lg:grid-cols-3 gap-8"}
                      >
                        <Card className={"lg:col-span-2 glass-card overflow-hidden group border-none shadow-xl flex flex-col"}>
                          <CardHeader className={"p-8 pb-4"}>
                            <div className={"flex items-center gap-4"}>
                              <div className={"w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform"}>
                                <Clock className={"w-6 h-6"} />
                              </div>
                              <div className={"space-y-1"}>
                                <CardTitle className={"text-2xl font-black text-slate-900 dark:text-white"}>
                                  {ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SECTION_TITLE}
                                </CardTitle>
                                <CardDescription className={"text-slate-400 font-medium"}>
                                  {ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SECTION_DESC}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className={"p-8 pt-6 space-y-10 flex-1"}>
                            <div className={"grid grid-cols-1 md:grid-cols-2 gap-10"}>
                              {/* Shift 1 */}
                              <div className={"space-y-6"}>
                                <div className={"flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800"}>
                                  <h3 className={"font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 italic uppercase tracking-wider"}>
                                    <div className={"w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs not-italic font-black"}>
                                      {ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_01}
                                    </div>
                                    {ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_1.LABEL}
                                  </h3>
                                </div>
                                <div className={"grid grid-cols-1 gap-5"}>
                                  <FormField
                                    control={form.control}
                                    name={"shift1CheckIn"}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className={"text-xs font-bold text-slate-500 uppercase flex items-center gap-2"}>
                                          <ChevronRight className={"w-3 h-3 text-primary"} />
                                          {ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_1.CHECK_IN.LABEL}
                                        </FormLabel>
                                        <FormControl>
                                           <div className={"relative group/input"}>
                                              <Input type={"time"} {...field} className={"premium-input h-12 pl-12 bg-slate-50/30"} />
                                              <Clock className={"absolute left-4 top-3.5 w-5 h-5 text-slate-300 pointer-events-none group-focus-within/input:text-primary transition-colors"} />
                                           </div>
                                        </FormControl>
                                        <FormMessage className={"text-[10px] font-bold"} />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={"shift1CheckOut"}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className={"text-xs font-bold text-slate-500 uppercase flex items-center gap-2"}>
                                          <ChevronRight className={"w-3 h-3 text-primary"} />
                                          {ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_1.CHECK_OUT.LABEL}
                                        </FormLabel>
                                        <FormControl>
                                           <div className={"relative group/input"}>
                                              <Input type={"time"} {...field} className={"premium-input h-12 pl-12 bg-slate-50/30"} />
                                              <Clock className={"absolute left-4 top-3.5 w-5 h-5 text-slate-300 pointer-events-none group-focus-within/input:text-primary transition-colors"} />
                                           </div>
                                        </FormControl>
                                        <FormMessage className={"text-[10px] font-bold"} />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>

                              {/* Shift 2 */}
                              <div className={"space-y-6"}>
                                <div className={"flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800"}>
                                  <h3 className={"font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 italic uppercase tracking-wider"}>
                                    <div className={"w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs not-italic font-black"}>
                                      {ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_02}
                                    </div>
                                    {ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_2.LABEL}
                                  </h3>
                                </div>
                                <div className={"grid grid-cols-1 gap-5"}>
                                  <FormField
                                    control={form.control}
                                    name={"shift2CheckIn"}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className={"text-xs font-bold text-slate-500 uppercase flex items-center gap-2"}>
                                          <ChevronRight className={"w-3 h-3 text-primary"} />
                                          {ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_2.CHECK_IN.LABEL}
                                        </FormLabel>
                                        <FormControl>
                                           <div className={"relative group/input"}>
                                              <Input type={"time"} {...field} className={"premium-input h-12 pl-12 bg-slate-50/30"} />
                                              <Clock className={"absolute left-4 top-3.5 w-5 h-5 text-slate-300 pointer-events-none group-focus-within/input:text-primary transition-colors"} />
                                           </div>
                                        </FormControl>
                                        <FormMessage className={"text-[10px] font-bold"} />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={"shift2CheckOut"}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className={"text-xs font-bold text-slate-500 uppercase flex items-center gap-2"}>
                                          <ChevronRight className={"w-3 h-3 text-primary"} />
                                          {ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_2.CHECK_OUT.LABEL}
                                        </FormLabel>
                                        <FormControl>
                                           <div className={"relative group/input"}>
                                              <Input type={"time"} {...field} className={"premium-input h-12 pl-12 bg-slate-50/30"} />
                                              <Clock className={"absolute left-4 top-3.5 w-5 h-5 text-slate-300 pointer-events-none group-focus-within/input:text-primary transition-colors"} />
                                           </div>
                                        </FormControl>
                                        <FormMessage className={"text-[10px] font-bold"} />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          
                          {/* Inner Confirm Button for Time */}
                          <div className={"p-8 pt-0 mt-auto flex justify-end"}>
                             <Button 
                              type={"button"}
                              onClick={() => form.handleSubmit(onSubmit as any)()}
                              className={"h-12 px-6 rounded-xl gradient-primary text-white shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold gap-2"}
                            >
                              <CheckCircle2 className={"w-4 h-4"} />
                              {ATTENDANCE_SETTINGS_CONSTANTS.BUTTONS.CONFIRM_TIME}
                            </Button>
                          </div>
                        </Card>

                        {/* Aside Settings */}
                        <div className={"space-y-8"}>
                          <Card className={"glass-card border-none shadow-xl group"}>
                            <CardHeader className={"p-8 pb-4"}>
                              <div className={"w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:rotate-12 transition-transform"}>
                                <Sparkles className={"w-6 h-6"} />
                              </div>
                              <div className={"space-y-1 mt-4"}>
                                <CardTitle className={"text-xl font-black"}>
                                  {ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.GRACE_PERIODS_SUBTITLE}
                                </CardTitle>
                                <CardDescription className={"text-slate-400 font-medium tracking-tight"}>
                                  {ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.GRACE_PERIODS_DESC}
                                </CardDescription>
                              </div>
                            </CardHeader>
                            <CardContent className={"p-8 pt-2 space-y-6"}>
                              <FormField
                                control={form.control}
                                name={"gracePeriod"}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={"text-xs font-bold text-slate-500 uppercase"}>{ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.GRACE_PERIOD.LABEL}</FormLabel>
                                    <FormControl>
                                      <div className={"relative group/input"}>
                                        <Input type={"number"} {...field} className={"premium-input h-12 pr-16 bg-white/50 dark:bg-slate-800/50"} />
                                        <span className={"absolute right-4 top-3 text-[10px] font-black text-slate-400 uppercase tracking-widest"}>{ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.GRACE_PERIOD.SUFFIX}</span>
                                      </div>
                                    </FormControl>
                                    <FormMessage className={"text-[10px] font-bold"} />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={"earlyLeaveThreshold"}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={"text-xs font-bold text-slate-500 uppercase"}>{ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.EARLY_LEAVE_THRESHOLD.LABEL}</FormLabel>
                                    <FormControl>
                                      <div className={"relative group/input"}>
                                        <Input type={"number"} {...field} className={"premium-input h-12 pr-16 bg-white/50 dark:bg-slate-800/50"} />
                                        <span className={"absolute right-4 top-3 text-[10px] font-black text-slate-400 uppercase tracking-widest"}>{ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.EARLY_LEAVE_THRESHOLD.SUFFIX}</span>
                                      </div>
                                    </FormControl>
                                    <FormMessage className={"text-[10px] font-bold"} />
                                  </FormItem>
                                )}
                              />
                            </CardContent>
                          </Card>
                          
                          <div className={"p-8 rounded-3xl bg-primary/5 border border-primary/10 flex items-start gap-4 hover:bg-primary/10 transition-colors group/info"}>
                            <div className={"w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover/info:scale-110 transition-transform"}>
                                <Shield className={"w-5 h-5"} />
                            </div>
                            <div className={"space-y-1"}>
                                <h4 className={"text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest"}>
                                  {ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.PROCESS_TITLE}
                                </h4>
                                <p className={"text-[10px] text-slate-500 leading-relaxed font-medium"}>
                                  {ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.PROCESS_DESC}
                                </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </TabsContent>

                    {/* Location Rules Tab Content */}
                    <TabsContent key={"location-pane"} value={"location"} className={"mt-0 focus-visible:ring-0 data-[state=inactive]:hidden"}>
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className={"grid grid-cols-1 lg:grid-cols-3 gap-8"}
                      >
                        <Card className={"lg:col-span-2 glass-card overflow-hidden group border-none shadow-xl flex flex-col"}>
                           <CardHeader className={"p-8 pb-4"}>
                            <div className={"flex items-center gap-4"}>
                              <div className={"w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform"}>
                                <MapPin className={"w-6 h-6"} />
                              </div>
                              <div className={"space-y-1"}>
                                <CardTitle className={"text-2xl font-black text-slate-900 dark:text-white"}>
                                  {ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.SECTION_TITLE}
                                </CardTitle>
                                <CardDescription className={"text-slate-400 font-medium"}>
                                  {ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.SECTION_DESC}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className={"p-8 pt-6 space-y-10 flex-1"}>
                                <FormField
                                  control={form.control}
                                  name={"gpsEnabled"}
                                  render={({ field }) => (
                                    <FormItem className={"p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between group/toggle overflow-hidden relative space-y-0"}>
                                        <div className={cn("absolute inset-0 transition-opacity pointer-events-none", gpsEnabled ? "bg-emerald-500/5 opacity-100" : "bg-slate-500/5 opacity-0")} />
                                        <div className={"space-y-1 relative z-10"}>
                                            <FormLabel className={"font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 cursor-pointer"}>
                                                {ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.GPS_ENABLED.LABEL}
                                                {gpsEnabled && <span className={"w-2 h-2 rounded-full bg-emerald-500 animate-pulse"} />}
                                            </FormLabel>
                                            <FormDescription className={"text-xs text-slate-500 font-medium max-w-sm"}>
                                                {ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.GPS_ENABLED.DESCRIPTION}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                          <Switch 
                                            checked={field.value} 
                                            onCheckedChange={field.onChange} 
                                            className={"data-[state=checked]:bg-emerald-500 h-7 w-12 relative z-10"}
                                          />
                                        </FormControl>
                                    </FormItem>
                                  )}
                                />

                            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-10 transition-all duration-500", !gpsEnabled && "opacity-40 grayscale pointer-events-none")}>
                                <FormField
                                  control={form.control}
                                  name={"latitude"}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className={"text-xs font-bold text-slate-500 uppercase flex items-center gap-2"}>
                                        <ChevronRight className={"w-3 h-3 text-primary"} />
                                        {ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.COORDINATES.LATITUDE.LABEL}
                                      </FormLabel>
                                      <FormControl>
                                         <div className={"relative group/input"}>
                                            <Input {...field} className={"premium-input h-12 pl-12 font-mono bg-slate-50/30"} placeholder={ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.COORDINATES.LATITUDE.PLACEHOLDER} />
                                            <MapPin className={"absolute left-4 top-3.5 w-5 h-5 text-slate-300 pointer-events-none group-focus-within/input:text-emerald-500 transition-colors"} />
                                         </div>
                                      </FormControl>
                                      <FormMessage className={"text-[10px] font-bold"} />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"longitude"}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className={"text-xs font-bold text-slate-500 uppercase flex items-center gap-2"}>
                                        <ChevronRight className={"w-3 h-3 text-primary"} />
                                        {ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.COORDINATES.LONGITUDE.LABEL}
                                      </FormLabel>
                                      <FormControl>
                                         <div className={"relative group/input"}>
                                            <Input {...field} className={"premium-input h-12 pl-12 font-mono bg-slate-50/30"} placeholder={ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.COORDINATES.LONGITUDE.PLACEHOLDER} />
                                            <MapPin className={"absolute left-4 top-3.5 w-5 h-5 text-slate-300 pointer-events-none group-focus-within/input:text-emerald-500 transition-colors"} />
                                         </div>
                                      </FormControl>
                                      <FormMessage className={"text-[10px] font-bold"} />
                                    </FormItem>
                                  )}
                                />
                            </div>
                          </CardContent>
                          
                          {/* Inner Confirm Button for Location */}
                          <div className={"p-8 pt-0 mt-auto flex justify-end"}>
                             <Button 
                              type={"button"}
                              onClick={() => form.handleSubmit(onSubmit as any)()}
                              className={"h-12 px-6 rounded-xl gradient-primary text-white shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold gap-2"}
                            >
                              <CheckCircle2 className={"w-4 h-4"} />
                              {ATTENDANCE_SETTINGS_CONSTANTS.BUTTONS.CONFIRM_LOCATION}
                            </Button>
                          </div>
                        </Card>

                        <div className={"space-y-8"}>
                           <Card className={cn("glass-card border-none shadow-xl group transition-all duration-500", !gpsEnabled && "grayscale opacity-40")}>
                              <CardHeader className={"p-8 pb-4"}>
                                <div className={"w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:rotate-12 transition-transform"}>
                                  <Sparkles className={"w-6 h-6"} />
                                </div>
                                <div className={"space-y-1 mt-4"}>
                                  <CardTitle className={"text-xl font-black"}>
                                    {ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.VALIDATION_TITLE}
                                  </CardTitle>
                                  <CardDescription className={"text-slate-400 font-medium tracking-tight"}>
                                    {ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.VALIDATION_DESC}
                                  </CardDescription>
                                </div>
                              </CardHeader>
                              <CardContent className={"p-8 pt-2 space-y-6"}>
                                <FormField
                                  control={form.control}
                                  name={"radius"}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className={"text-xs font-bold text-slate-500 uppercase"}>{ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.RADIUS.LABEL}</FormLabel>
                                      <FormControl>
                                         <div className={"relative group/input"}>
                                            <Input type={"number"} {...field} className={"premium-input h-12 pr-16 bg-white/50 dark:bg-slate-800/50"} />
                                            <span className={"absolute right-4 top-3 text-[10px] font-black text-slate-400 uppercase tracking-widest"}>{ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.RADIUS.SUFFIX}</span>
                                         </div>
                                      </FormControl>
                                      <FormMessage className={"text-[10px] font-bold"} />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"locationAction"}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className={"text-xs font-bold text-slate-500 uppercase"}>{ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.ACTION_ON_MISMATCH.LABEL}</FormLabel>
                                      <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                          <SelectTrigger className={"premium-input h-12 font-bold text-slate-700 bg-white/50 dark:bg-slate-800/50"}>
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className={"rounded-2xl border-slate-200"}>
                                          {LOCATION_ACTION_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value} className={"h-10 rounded-lg focus:bg-primary/10 focus:text-primary font-medium"}>
                                              {option.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage className={"text-[10px] font-bold"} />
                                    </FormItem>
                                  )}
                                />
                              </CardContent>
                           </Card>

                           <div className={"p-8 rounded-3xl bg-primary/5 border border-primary/10 flex items-start gap-4 hover:bg-primary/10 transition-colors group/info"}>
                            <div className={"w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover/info:scale-110 transition-transform"}>
                                <Shield className={"w-5 h-5"} />
                            </div>
                            <div className={"space-y-1"}>
                                <h4 className={"text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest"}>
                                  {ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.PROCESS_TITLE}
                                </h4>
                                <p className={"text-[10px] text-slate-500 leading-relaxed font-medium"}>
                                  {ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.PROCESS_DESC}
                                </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </TabsContent>
                </div>
              </Tabs>
            </form>
          </Form>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
