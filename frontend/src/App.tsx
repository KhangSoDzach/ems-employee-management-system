import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ThemeProvider from "@/contexts/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import { COMMON_TEXT } from "./constants/ui-texts";
import { AUTH_ROLES } from "./constants/auth";

const LoginPage = lazy(() =>
  import("@/features/auth/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("./features/auth/ForgotPasswordPage").then((module) => ({
    default: module.ForgotPasswordPage,
  })),
);
const Dashboard = lazy(() => import("./features/admin/Dashboard"));
const EmployeeDashboard = lazy(
  () => import("./features/employee/EmployeeDashboard"),
);
const RequestPage = lazy(() => import("./features/employee/RequestPage"));
const CheckinPage = lazy(() => import("./features/employee/CheckinPage"));
const ApproveLeaveRequest = lazy(
  () => import("./features/manager/ApproveLeaveRequest"),
);
const AttendanceHistoryPage = lazy(
  () => import("./features/employee/AttendanceHistoryPage"),
);
const AssetManagementPage = lazy(
  () => import("./features/admin/Asset-Management"),
);
const AttendanceSettings = lazy(
  () => import("./features/admin/AttendanceSettings"),
);
const AssetIncidentManagementPage = lazy(
  () => import("./features/admin/AssetIncidentManagementPage"),
);
const ApproveAdjustmentRequest = lazy(
  () => import("./features/manager/ApproveAdjustmentRequest"),
);
const MyAssetsPage = lazy(() => import("./features/employee/MyAssetsPage"));
const KpiOkrManagement = lazy(
  () => import("./features/manager/KpiOkrManagement"),
);
const MemberList = lazy(() => import("./features/manager/MemberList"));
const PayrollManagement = lazy(() => import("@/features/hr/PayrollManagement"));
const AssetReportManagement = lazy(
  () => import("./features/admin/AssetReportManagement"),
);
const AssetRequestManagement = lazy(
  () => import("./features/admin/AssetRequestManagement"),
);
const AssetGroupManagement = lazy(
  () => import("./features/manager/AssetGroupManagement"),
);
const EmployeeManagement = lazy(
  () => import("./features/hr/EmployeeManagement"),
);
const SalaryHistoryPage = lazy(
  () => import("./features/employee/SalaryHistoryPage"),
);
const ProfilePage = lazy(() => import("./components/ProfilePage"));
const AnnouncementsPage = lazy(
  () => import("./features/employee/AnnouncementsPage"),
);
const AnnouncementManagementPage = lazy(
  () => import("./features/hr/AnnouncementManagementPage"),
);
const AuditLogsPage = lazy(() => import("./features/admin/AuditLogsPage"));

function RouteFallback() {
  return (
    <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">
      {COMMON_TEXT.LOADING}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Shared cross-roles: Admin + HR + Manager */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      AUTH_ROLES.ADMIN,
                      AUTH_ROLES.HR,
                      AUTH_ROLES.MANAGER,
                    ]}
                  />
                }
              >
                <Route
                  path="/asset-incidents"
                  element={<AssetIncidentManagementPage />}
                />
                <Route
                  path="/asset-reports"
                  element={<AssetReportManagement />}
                />
                <Route
                  path="/asset-requests"
                  element={<AssetRequestManagement />}
                />
                <Route path="/hr-employees" element={<EmployeeManagement />} />
              </Route>

              {/* Announcements: all authenticated roles */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      AUTH_ROLES.ADMIN,
                      AUTH_ROLES.HR,
                      AUTH_ROLES.MANAGER,
                      AUTH_ROLES.EMPLOYEE,
                    ]}
                  />
                }
              >
                <Route path="/announcements" element={<AnnouncementsPage />} />
              </Route>

              {/* Admin + HR */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[AUTH_ROLES.ADMIN, AUTH_ROLES.HR]}
                  />
                }
              >
                <Route path="/assets" element={<AssetManagementPage />} />
                <Route path="/payroll" element={<PayrollManagement />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
                <Route
                  path="/announcements/manage"
                  element={<AnnouncementManagementPage />}
                />
              </Route>

              {/* Admin + HR */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[AUTH_ROLES.ADMIN, AUTH_ROLES.HR]}
                  />
                }
              >
                <Route
                  path="/attendance-settings"
                  element={<AttendanceSettings />}
                />
              </Route>

              {/* Profile + My Assets: tất cả 4 roles */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      AUTH_ROLES.ADMIN,
                      AUTH_ROLES.HR,
                      AUTH_ROLES.MANAGER,
                      AUTH_ROLES.EMPLOYEE,
                    ]}
                  />
                }
              >
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/my-assets" element={<MyAssetsPage />} />
              </Route>

              {/* Check-in / Attendance / Adjustment shared: Employee, HR, Manager */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      AUTH_ROLES.EMPLOYEE,
                      AUTH_ROLES.HR,
                      AUTH_ROLES.MANAGER,
                    ]}
                  />
                }
              >
                <Route path="/checkin" element={<CheckinPage />} />
                <Route path="/attendance" element={<AttendanceHistoryPage />} />
                <Route path="/adjustment-requests" element={<RequestPage />} />
                <Route path="/request" element={<RequestPage />} />
              </Route>

              {/* Employee only */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={[AUTH_ROLES.EMPLOYEE]} />
                }
              >
                <Route path="/employee" element={<EmployeeDashboard />} />
                <Route path="/salary-history" element={<SalaryHistoryPage />} />
              </Route>

              {/* Shared MemberList: Manager + Employee */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[AUTH_ROLES.MANAGER, AUTH_ROLES.EMPLOYEE]}
                  />
                }
              >
                <Route path="/members" element={<MemberList />} />
              </Route>

              {/* Manager only */}
              <Route
                element={<ProtectedRoute allowedRoles={[AUTH_ROLES.MANAGER]} />}
              >
                <Route path="/kpi-okr" element={<KpiOkrManagement />} />
                <Route path="/approve" element={<ApproveLeaveRequest />} />
                <Route
                  path="/approve-adjustments"
                  element={<ApproveAdjustmentRequest />}
                />
                <Route
                  path="/view-group-asset"
                  element={<AssetGroupManagement />}
                />
              </Route>

              {/* HR only */}
              <Route
                element={<ProtectedRoute allowedRoles={[AUTH_ROLES.HR]} />}
              >
                <Route path="/hr/employees" element={<Dashboard />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster richColors position="top-center" visibleToasts={1} />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
