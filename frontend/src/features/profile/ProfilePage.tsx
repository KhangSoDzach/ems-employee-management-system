/**
 * @file ProfilePage.tsx
 * @description Trang hồ sơ cá nhân của nhân viên, hiển thị thông tin chi tiết và các chỉ số liên quan.
 * Employee profile page, displaying detailed information and relevant metrics.
 */

import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { FileText, Image as ImageIcon, Download } from "lucide-react";
import { employeeService } from "@/services/employeeService";
import { leaveService } from "@/services/leaveService";
import { attendanceService } from "@/services/attendanceService";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import {
  profileSchema,
  defaultProfileValues,
  type ProfileFormValues,
} from "./schemas/ProfileSchema";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";

// Sub-components
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileContactSection } from "./components/ProfileContactSection";
import { ProfileJobSection } from "./components/ProfileJobSection";
import { ProfileDocuments } from "./components/ProfileDocuments";
import { ProfileStats } from "./components/ProfileStats";

/**
 * @component ProfilePage
 * @description Thành phần chính hiển thị hồ sơ cá nhân ở chế độ chỉ đọc.
 * Main component displaying the personal profile in read-only mode.
 */
/**
 * ProfilePage Component
 * Provides a read-only view of the employee's personal and professional profile.
 *
 * Capabilities:
 * - Personal Information: View contact details, national ID, and date of birth.
 * - Job Details: Display department, position, hire date, and work status.
 * - Document Repository: Access and download verified employee documents (PDFs, Images).
 * - Balance Overview: Track remaining leave balances and annual attendance percentage.
 * - Account Security: Integrated password reset functionality through ForgotPasswordPage.
 * - RBAC Compliance: Strict read-only mode for employees (US-07 AC-04).
 */
export default function ProfilePage() {
  const canEdit = false; // Toàn bộ người dùng không được phép tự ý chỉnh sửa thông tin cá nhân (US-07 AC-04)
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaultProfileValues,
    mode: "onChange",
  });
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: employeeService.getMyProfile,
  });
  const leaveBalancesQuery = useQuery({
    queryKey: ["leave-balances", "me"],
    queryFn: leaveService.getMyLeaveBalances,
    enabled: !!profileQuery.data,
  });
  const attendanceSummaryQuery = useQuery({
    queryKey: ["attendance", "summary", "me"],
    queryFn: () => attendanceService.getSummary(),
    enabled: !!profileQuery.data,
  });
  const employeeFilesQuery = useQuery({
    queryKey: ["profile", "me", "files"],
    queryFn: employeeService.getMyEmployeeFiles,
    enabled: !!profileQuery.data,
  });
  useEffect(() => {
    const data = profileQuery.data;
    if (!data) {
      return;
    }
    const email = data.email ?? "";
    setUserEmail(email);
    form.reset({
      employeeCode: data.employeeCode ?? "",
      fullName: [data.firstName, data.lastName].filter(Boolean).join(" "),
      companyEmail: email,
      nationalId: data.nationalId ?? "",
      phoneNumber: data.phone ?? "",
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : new Date(),
      startDate: data.hireDate ? new Date(data.hireDate) : new Date(),
      department: data.department ?? "",
      jobRole: data.position ?? "",
      workStatus: (data.status as ProfileFormValues["workStatus"]) ?? "ACTIVE",
      contractType: "FULL_TIME",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileQuery.data]);
  const attendancePercentage =
    attendanceSummaryQuery.data?.attendancePercentage ??
    profileQuery.data?.attendancePercentage ??
    0;

  function onSubmit(data: ProfileFormValues) {
    void data;
    alert(SYSTEM_MESSAGES.PROFILE.MODAL_SUCCESS);
  }
  if (profileQuery.isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center min-vh-page">
        <p className="text-muted-foreground animate-pulse">
          {SYSTEM_MESSAGES.LOADING}
        </p>
      </main>
    );
  }
  if (profileQuery.isError) {
    return (
      <main className="flex flex-1 items-center justify-center min-vh-page">
        <p className="text-destructive font-medium">
          {SYSTEM_MESSAGES.API_ERROR}
        </p>
      </main>
    );
  }
  const renderDocuments = (): ReactNode => {
    if (employeeFilesQuery.isLoading) {
      return (
        <p className="text-sm text-muted-foreground">
          {SYSTEM_MESSAGES.LOADING}
        </p>
      );
    }
    if (employeeFilesQuery.data && employeeFilesQuery.data.length > 0) {
      return employeeFilesQuery.data.map((doc) => {
        const lowerFileName = doc.originalFileName.toLowerCase();
        const lowerFileType = (doc.fileType || "").toLowerCase();
        const isPdf =
          lowerFileType.includes("pdf") || lowerFileName.endsWith(".pdf");
        const createdDate = doc.createdAt
          ? format(new Date(doc.createdAt), "dd/MM/yyyy")
          : "";
        return (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 border rounded-xl bg-gray-50/50 dark:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {isPdf ? (
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
                  {doc.originalFileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {SYSTEM_MESSAGES.DOCUMENTS.STATUS_VERIFIED}
                  {createdDate ? ` • ${createdDate}` : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="ml-2 p-1.5 rounded-md text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
              title={SYSTEM_MESSAGES.DOWNLOAD_TOOLTIP}
              onClick={() => {
                if (doc.fileUrl) {
                  globalThis.open(doc.fileUrl, "_blank", "noopener,noreferrer");
                }
              }}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        );
      });
    }
    return (
      <p className="text-sm text-muted-foreground">{SYSTEM_MESSAGES.NO_DATA}</p>
    );
  };
  return (
    <main className="page-layout-wrapper">
      <ProfileHeader canEdit={canEdit} form={form} onSubmit={onSubmit} />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2 space-y-6">
            <ProfileContactSection
              canEdit={canEdit}
              form={form}
              setResetPasswordOpen={setResetPasswordOpen}
            />
            <ProfileJobSection canEdit={canEdit} form={form} />
          </div>
          <div className="space-y-6">
            <ProfileDocuments documentsContent={renderDocuments()} />
            <ProfileStats
              leaveBalances={leaveBalancesQuery.data || []}
              attendancePercentage={attendancePercentage}
            />
          </div>
        </form>
      </Form>
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 rounded-xl overflow-hidden border-none shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">
            {SYSTEM_MESSAGES.PROFILE_RESET.DIALOG_TITLE}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {SYSTEM_MESSAGES.PROFILE_RESET.DIALOG_DESC}
          </DialogDescription>
          <ForgotPasswordPage
            isProfileMode={true}
            userEmail={userEmail}
            onClose={() => setResetPasswordOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
