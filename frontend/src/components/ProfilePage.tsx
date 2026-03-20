import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, differenceInYears } from "date-fns";
import {
  CalendarIcon,
  FileText,
  Image as ImageIcon,
  MapPin,
  ShieldCheck,
  Briefcase,
  Download,
  KeyRound,
} from "lucide-react";
import { employeeService } from "@/services/employeeService";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { SYSTEM_MESSAGES } from "@/constants/messages";
import {
  DEPARTMENT_OPTIONS,
  ROLE_OPTIONS,
  CONTRACT_OPTIONS,
  WORK_STATUS_OPTIONS,
} from "@/constants/options";
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";

const CONTRACT_CLASSES: Record<string, string> = {
  FULL_TIME: "bg-green-100 text-green-700",
  PART_TIME: "bg-blue-100 text-blue-700",
  CONTRACT: "bg-yellow-100 text-yellow-700",
  INTERN: "bg-purple-100 text-purple-700",
  DEFAULT: "bg-gray-100 text-gray-700",
};

const profileSchema = z.object({
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
  lineManager: z.string().min(1, FORM_VALIDATION_MESSAGES.MANAGER_REQUIRED),
  workStatus: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const defaultValues: Partial<ProfileFormValues> = {
  employeeCode: "",
  fullName: "",
  nationalId: "",
  companyEmail: "",
  phoneNumber: "",
  contractType: "FULL_TIME",
  department: "",
  jobRole: "",
  lineManager: "",
  workStatus: "ACTIVE",
};

export default function ProfilePage() {
  const effectiveRole = useEffectiveRole();
  const canEdit = false; // Toàn bộ người dùng không được phép tự ý chỉnh sửa thông tin cá nhân (US-07 AC-04)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
    mode: "onChange",
  });

  // --- Load hồ sơ thực từ backend GET /api/v1/employees/me ---
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    employeeService
      .getMyProfile()
      .then((data) => {
        const email = data.email ?? "";
        setUserEmail(email);
        form.reset({
          employeeCode: data.employeeCode ?? "",
          fullName: [data.firstName, data.lastName].filter(Boolean).join(" "),
          companyEmail: email,
          nationalId: data.nationalId ?? "", // trường nhạy cảm – có thể server chưa trả
          phoneNumber: data.phone ?? "",
          dateOfBirth: data.dateOfBirth
            ? new Date(data.dateOfBirth)
            : new Date(),
          startDate: data.hireDate ? new Date(data.hireDate) : new Date(),
          department: data.department ?? "",
          jobRole: data.position ?? "",
          lineManager: "", // chưa có trong PublicEmployeeResponse
          workStatus:
            (data.status as ProfileFormValues["workStatus"]) ?? "ACTIVE",
          contractType: "FULL_TIME",
        });
      })
      .catch(() => setProfileError(SYSTEM_MESSAGES.API_ERROR))
      .finally(() => setProfileLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ----------------------------------------------------------

  function onSubmit(data: ProfileFormValues) {
    console.log("Form submitted: ", data);
    alert(SYSTEM_MESSAGES.PROFILE.MODAL_SUCCESS);
  }

  const hrDocuments = [
    {
      name: SYSTEM_MESSAGES.DOCUMENTS.DOC_1_NAME || "Hợp đồng lao động",
      type: "pdf",
      date: "Thg 8, 2021",
      status: SYSTEM_MESSAGES.DOCUMENTS.STATUS_SIGNED,
    },
    {
      name: SYSTEM_MESSAGES.DOCUMENTS.DOC_2_NAME || "Thư mời nhận việc",
      type: "pdf",
      date: "Thg 7, 2021",
      status: SYSTEM_MESSAGES.DOCUMENTS.STATUS_VERIFIED,
    },
    {
      name: SYSTEM_MESSAGES.DOCUMENTS.DOC_3_NAME || "Bảng mô tả công việc",
      type: "pdf",
      date: "Thg 8, 2021",
      status: SYSTEM_MESSAGES.DOCUMENTS.STATUS_VERIFIED,
    },
  ];

  // Loading skeleton
  if (profileLoading) {
    return (
      <SidebarProvider>
        <AppSidebar role={effectiveRole} variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <main className="flex flex-1 items-center justify-center min-h-screen">
            <p className="text-muted-foreground animate-pulse">
              {SYSTEM_MESSAGES.LOADING}
            </p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // API Error banner
  if (profileError) {
    return (
      <SidebarProvider>
        <AppSidebar role={effectiveRole} variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <main className="flex flex-1 items-center justify-center min-h-screen">
            <p className="text-destructive font-medium">{profileError}</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar role={effectiveRole} variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main className="page-layout-wrapper">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            {/* Page Header */}
            <h1 className="page-heading">{SYSTEM_MESSAGES.PROFILE.TITLE}</h1>
            <div className="flex items-center gap-3">
              {canEdit ? (
                <>
                  <Button
                    variant="outline"
                    className="font-semibold"
                    onClick={() => form.reset()}
                  >
                    {SYSTEM_MESSAGES.BTN_CANCEL}
                  </Button>
                  <Button
                    onClick={form.handleSubmit(onSubmit)}
                    className="font-bold bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
                  >
                    {SYSTEM_MESSAGES.BTN_UPDATE}
                  </Button>
                </>
              ) : (
                <span className={cn("status-badge")}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {SYSTEM_MESSAGES.VIEW_MODE}
                </span>
              )}
            </div>
          </div>

          <div className="content-card-header mb-6">
            <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg relative flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-400">
                  {form.watch("fullName")?.charAt(0) || "?"}
                </span>
              </div>
              <div className="text-center md:text-left pt-2">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                  <h2 className="text-2xl font-bold">
                    {form.watch("fullName")}
                  </h2>
                  <span
                    className={cn(
                      "px-3 py-1 text-xs font-bold rounded-full uppercase",
                      CONTRACT_CLASSES[form.watch("contractType")] ||
                        CONTRACT_CLASSES.DEFAULT,
                    )}
                  >
                    {form.watch("contractType").replace("_", " ")}
                  </span>
                </div>
                <p className="text-muted-foreground font-medium">
                  {form.watch("jobRole")} &bull;{" "}
                  {SYSTEM_MESSAGES.PROFILE.DEPARTMENT_PREFIX}
                  {form.watch("department")}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />{" "}
                    {SYSTEM_MESSAGES.PROFILE.OFFICE_LOCATION}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-6 md:gap-4 w-full md:w-auto md:text-right text-left bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-xl border">
              <div className="flex-1 md:flex-none">
                <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase">
                  {SYSTEM_MESSAGES.PROFILE.EMP_CODE}
                </p>
                <p className="font-bold">{form.watch("employeeCode")}</p>
              </div>
              {effectiveRole === "employee" && (
                <div className="flex-1 md:flex-none">
                  <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase">
                    {SYSTEM_MESSAGES.PROFILE.MANAGER}
                  </p>
                  <div className="flex items-center gap-2 justify-start md:justify-end">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                      {form.watch("lineManager")?.charAt(0) || "?"}
                    </div>
                    <p className="font-bold">{form.watch("lineManager")}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="content-card">
                  <h3 className="section-title">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    {SYSTEM_MESSAGES.PROFILE.CONTACT_SECTION}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="form-label-bold">
                            {SYSTEM_MESSAGES.PROFILE.FULL_NAME}
                          </FormLabel>
                          <FormControl>
                            <Input
                              readOnly={!canEdit}
                              placeholder={
                                SYSTEM_MESSAGES.PROFILE.NAME_PLACEHOLDER
                              }
                              {...field}
                              className={cn(
                                "input-readonly",
                                canEdit && "bg-background focus-visible:ring-2",
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="form-label-bold">
                            {SYSTEM_MESSAGES.PROFILE.EMAIL}
                          </FormLabel>
                          <FormControl>
                            <Input
                              readOnly={!canEdit}
                              placeholder={
                                SYSTEM_MESSAGES.PROFILE.EMAIL_PLACEHOLDER
                              }
                              {...field}
                              className={cn(
                                "input-readonly",
                                canEdit && "bg-background focus-visible:ring-2",
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nationalId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="form-label-bold">
                            {SYSTEM_MESSAGES.PROFILE.NATIONAL_ID}
                          </FormLabel>
                          <FormControl>
                            <Input
                              readOnly={!canEdit}
                              placeholder={
                                SYSTEM_MESSAGES.PROFILE.ID_PLACEHOLDER
                              }
                              {...field}
                              className={cn(
                                "input-readonly",
                                canEdit && "bg-background focus-visible:ring-2",
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="form-label-bold">
                            {SYSTEM_MESSAGES.PROFILE.PHONE}
                          </FormLabel>
                          <FormControl>
                            <Input
                              readOnly={!canEdit}
                              placeholder={
                                SYSTEM_MESSAGES.PROFILE.PHONE_PLACEHOLDER
                              }
                              {...field}
                              className={cn(
                                "input-readonly",
                                canEdit && "bg-background focus-visible:ring-2",
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem className="form-data-item">
                          <FormLabel className="form-label-bold">
                            {SYSTEM_MESSAGES.PROFILE.DOB}
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  disabled={!canEdit}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal bg-gray-50/50",
                                    canEdit && "bg-background text-foreground",
                                    !canEdit &&
                                      "disabled:opacity-100 dark:disabled:opacity-100",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>
                                      {SYSTEM_MESSAGES.PROFILE.SELECT_DATE}
                                    </span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() ||
                                  date < new Date("1900-01-01")
                                }
                                defaultMonth={field.value}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col justify-end pb-[2px]">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full md:w-auto font-semibold text-primary border-primary/30 hover:bg-primary/5 h-10"
                        onClick={() => setResetPasswordOpen(true)}
                      >
                        <KeyRound className="w-4 h-4 mr-2" />
                        {SYSTEM_MESSAGES.PROFILE_RESET.BTN_RESET_PASSWORD}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="content-card">
                  <h3 className="section-title">
                    <Briefcase className="w-5 h-5 text-primary" />
                    {SYSTEM_MESSAGES.PROFILE.JOB_SECTION}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="employeeCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="form-label-bold">
                            {SYSTEM_MESSAGES.PROFILE.EMP_CODE}
                          </FormLabel>
                          <FormControl>
                            <Input
                              readOnly
                              {...field}
                              className="input-readonly bg-gray-100 dark:bg-gray-800"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="workStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="form-label-bold">
                            {SYSTEM_MESSAGES.PROFILE.WORK_STATUS}
                          </FormLabel>
                          <Select
                            disabled={!canEdit}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger
                                className={cn(
                                  "input-readonly",
                                  canEdit && "bg-background",
                                )}
                              >
                                <SelectValue
                                  placeholder={
                                    SYSTEM_MESSAGES.SELECT_PLACEHOLDER
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ACTIVE">
                                {WORK_STATUS_OPTIONS.ACTIVE}
                              </SelectItem>
                              <SelectItem value="INACTIVE">
                                {WORK_STATUS_OPTIONS.INACTIVE}
                              </SelectItem>
                              <SelectItem value="SUSPENDED">
                                {WORK_STATUS_OPTIONS.SUSPENDED}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="form-label-bold">
                            {SYSTEM_MESSAGES.LABEL_DEPARTMENT}
                          </FormLabel>
                          <Select
                            disabled={!canEdit}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger
                                className={cn(
                                  "input-readonly",
                                  canEdit && "bg-background",
                                )}
                              >
                                <SelectValue
                                  placeholder={
                                    SYSTEM_MESSAGES.SELECT_PLACEHOLDER
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Product Design">
                                {DEPARTMENT_OPTIONS.DESIGN}
                              </SelectItem>
                              <SelectItem value="Engineering">
                                {DEPARTMENT_OPTIONS.ENGINEERING}
                              </SelectItem>
                              <SelectItem value="Human Resources">
                                {DEPARTMENT_OPTIONS.HR}
                              </SelectItem>
                              <SelectItem value="Marketing">
                                {DEPARTMENT_OPTIONS.MARKETING}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="jobRole"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="form-label-bold">
                            {SYSTEM_MESSAGES.LABEL_ROLE}
                          </FormLabel>
                          <Select
                            disabled={!canEdit}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger
                                className={cn(
                                  "input-readonly",
                                  canEdit && "bg-background",
                                )}
                              >
                                <SelectValue
                                  placeholder={
                                    SYSTEM_MESSAGES.SELECT_PLACEHOLDER
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Senior UI/UX Designer">
                                {ROLE_OPTIONS.DESIGNER}
                              </SelectItem>
                              <SelectItem value="Frontend Engineer">
                                {ROLE_OPTIONS.FRONTEND}
                              </SelectItem>
                              <SelectItem value="Backend Engineer">
                                {ROLE_OPTIONS.BACKEND}
                              </SelectItem>
                              <SelectItem value="Product Manager">
                                {ROLE_OPTIONS.MANAGER}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contractType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="form-label-bold">
                            {SYSTEM_MESSAGES.PROFILE.CONTRACT}
                          </FormLabel>
                          <Select
                            disabled={!canEdit}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger
                                className={cn(
                                  "input-readonly",
                                  canEdit && "bg-background",
                                )}
                              >
                                <SelectValue
                                  placeholder={
                                    SYSTEM_MESSAGES.SELECT_PLACEHOLDER
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="FULL_TIME">
                                {CONTRACT_OPTIONS.FULL_TIME}
                              </SelectItem>
                              <SelectItem value="PART_TIME">
                                {CONTRACT_OPTIONS.PART_TIME}
                              </SelectItem>
                              <SelectItem value="CONTRACT">
                                {CONTRACT_OPTIONS.PROBATION}
                              </SelectItem>
                              <SelectItem value="INTERN">
                                {CONTRACT_OPTIONS.INTERN}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {effectiveRole === "employee" && (
                      <FormField
                        control={form.control}
                        name="lineManager"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="form-label-bold">
                              {SYSTEM_MESSAGES.PROFILE.MANAGER}
                            </FormLabel>
                            <Select
                              disabled={!canEdit}
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className={cn(
                                    "input-readonly",
                                    canEdit && "bg-background",
                                  )}
                                >
                                  <SelectValue
                                    placeholder={
                                      SYSTEM_MESSAGES.SELECT_PLACEHOLDER
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Michael Scott">
                                  Trần Anh Tuấn
                                </SelectItem>
                                <SelectItem value="Dwight Schrute">
                                  Lê Hoàng Long
                                </SelectItem>
                                <SelectItem value="Jim Halpert">
                                  Nguyễn Nhật Minh
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="form-data-item">
                          <FormLabel className="form-label-bold">
                            {SYSTEM_MESSAGES.PROFILE.START_DATE}
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  disabled={!canEdit}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal bg-gray-50/50",
                                    canEdit && "bg-background text-foreground",
                                    !canEdit &&
                                      "disabled:opacity-100 dark:disabled:opacity-100",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>
                                      {SYSTEM_MESSAGES.PROFILE.SELECT_DATE}
                                    </span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                defaultMonth={field.value || new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="form-data-item">
                          <FormLabel className="form-label-bold">
                            {SYSTEM_MESSAGES.PROFILE.END_DATE}
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  disabled={!canEdit}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal bg-gray-50/50",
                                    canEdit && "bg-background text-foreground",
                                    !canEdit &&
                                      "disabled:opacity-100 dark:disabled:opacity-100",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>
                                      {SYSTEM_MESSAGES.PROFILE.SELECT_DATE}
                                    </span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                defaultMonth={field.value || undefined}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="content-card h-min">
                  <h3 className="section-title">
                    {SYSTEM_MESSAGES.PROFILE.DOCS_SECTION}
                  </h3>
                  <div className="space-y-3">
                    {hrDocuments.map((doc, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 border rounded-xl bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/70 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {doc.type === "pdf" ? (
                            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-red-500" />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <ImageIcon className="w-4 h-4 text-blue-500" />
                            </div>
                          )}
                          <div className="truncate">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                              {doc.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {doc.status} • {doc.date}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="ml-2 p-1.5 rounded-md text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                          title={SYSTEM_MESSAGES.DOWNLOAD_TOOLTIP}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="content-card">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    {SYSTEM_MESSAGES.PROFILE.STATS_TITLE}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border bg-purple-50/50 dark:bg-purple-900/10 rounded-xl p-4 text-center">
                      <p className="text-3xl font-black text-purple-600 mb-1">
                        {0}
                      </p>
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        {SYSTEM_MESSAGES.PROFILE.STATS_LEAVE}
                      </p>
                    </div>
                    <div className="border bg-teal-50/50 dark:bg-teal-900/10 rounded-xl p-4 text-center">
                      <p className="text-3xl font-black text-teal-600 mb-1">
                        {0}
                        <span className="text-xl">
                          {SYSTEM_MESSAGES.PROFILE.PERCENT_SIGN}
                        </span>
                      </p>
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        {SYSTEM_MESSAGES.PROFILE.STATS_ATTENDANCE}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </Form>

          <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
            <DialogContent className="sm:max-w-md p-0 gap-0 rounded-xl overflow-hidden border-none shadow-2xl max-h-[90vh] overflow-y-auto">
              <ForgotPasswordPage
                isProfileMode={true}
                userEmail={userEmail}
                onClose={() => setResetPasswordOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
