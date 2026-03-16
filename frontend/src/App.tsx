import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";

const LoginPage = lazy(() => import("@/features/auth/LoginPage").then((module) => ({ default: module.LoginPage })));
const ForgotPasswordPage = lazy(() => import("./features/auth/ForgotPasswordPage").then((module) => ({ default: module.ForgotPasswordPage })));
const Dashboard = lazy(() => import("./features/admin/Dashboard"));
const EmployeeDashboard = lazy(() => import("./features/employee/EmployeeDashboard"));
const RequestPage = lazy(() => import("./features/employee/RequestPage"));
const CheckinPage = lazy(() => import("./features/employee/CheckinPage"));
const ApproveLeaveRequest = lazy(() => import("./features/manager/ApproveLeaveRequest"));
const AttendanceHistoryPage = lazy(() => import("./features/employee/AttendanceHistoryPage"));
const AssetManagementPage = lazy(() => import("./features/admin/Asset-Management"));
const AssetIncidentManagementPage = lazy(() => import("./features/admin/AssetIncidentManagementPage"));
const ApproveAdjustmentRequest = lazy(() => import("./features/manager/ApproveAdjustmentRequest"));
const MyAssetsPage = lazy(() => import("./features/employee/MyAssetsPage"));
const KpiOkrManagement = lazy(() => import("./features/manager/KpiOkrManagement"));
const MemberList = lazy(() => import("./features/manager/MemberList"));
const PayrollManagement = lazy(() => import("./features/hr/PayrollManagement"));
const AssetReportManagement = lazy(() => import("./features/admin/AssetReportManagement"));
const AssetGroupManagement = lazy(() => import("./features/manager/AssetGroupManagement"));
const EmployeeManagement = lazy(() => import("./features/hr/EmployeeManagement"));
const SalaryHistoryPage = lazy(() => import("./features/employee/SalaryHistoryPage"));
const ProfilePage = lazy(() => import("./components/ProfilePage"));

function RouteFallback() {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading...</div>;
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Suspense fallback={<RouteFallback />}>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                        {/* Shared cross-roles: Admin + HR + Manager */}
                        <Route element={<ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_HR", "ROLE_MANAGER"]} />}>
                            <Route path="/asset-incidents" element={<AssetIncidentManagementPage />} />
                            <Route path="/asset-reports" element={<AssetReportManagement />} />
                            <Route path="/hr-employees" element={<EmployeeManagement />} />
                            <Route path="/payroll" element={<PayrollManagement />} />
                        </Route>

                        {/* Shared Admin + HR */}
                        <Route element={<ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_HR"]} />}>
                            <Route path="/assets" element={<AssetManagementPage />} />
                        </Route>

                        {/* Profile + My Assets: tất cả 4 roles */}
                        <Route element={<ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_HR", "ROLE_MANAGER", "ROLE_EMPLOYEE"]} />}>
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/my-assets" element={<MyAssetsPage />} />
                        </Route>

                        {/* Check-in / Attendance / Adjustment shared: Employee, HR, Manager */}
                        <Route element={<ProtectedRoute allowedRoles={["ROLE_EMPLOYEE", "ROLE_HR", "ROLE_MANAGER"]} />}>
                            <Route path="/checkin" element={<CheckinPage />} />
                            <Route path="/attendance" element={<AttendanceHistoryPage />} />
                            <Route path="/adjustment-requests" element={<RequestPage />} />
                        </Route>

                        {/* Employee only */}
                        <Route element={<ProtectedRoute allowedRoles={["ROLE_EMPLOYEE"]} />}>
                            <Route path="/employee" element={<EmployeeDashboard />} />
                            <Route path="/salary-history" element={<SalaryHistoryPage />} />
                            <Route path="/request" element={<RequestPage />} />
                        </Route>

                        {/* Manager only */}
                        <Route element={<ProtectedRoute allowedRoles={["ROLE_MANAGER"]} />}>
                            <Route path="/members" element={<MemberList />} />
                            <Route path="/kpi-okr" element={<KpiOkrManagement />} />
                            <Route path="/approve" element={<ApproveLeaveRequest />} />
                            <Route path="/approve-adjustments" element={<ApproveAdjustmentRequest />} />
                            <Route path="/view-group-asset" element={<AssetGroupManagement />} />
                        </Route>

                        {/* HR only */}
                        <Route element={<ProtectedRoute allowedRoles={["ROLE_HR"]} />}>
                            <Route path="/hr/employees" element={<Dashboard />} />
                        </Route>

                    </Routes>
                </Suspense>
            </BrowserRouter>
            <Toaster richColors position="top-right" />
        </AuthProvider>
    );
}

export default App;
