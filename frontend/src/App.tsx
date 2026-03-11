import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import Dashboard from "./features/admin/Dashboard";
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage";
import EmployeeDashboard from "./features/employee/EmployeeDashboard";
import LeaveRequestPage from "./features/employee/LeaveRequestPage";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import CheckinPage from "./features/employee/CheckinPage";
import { Toaster } from "@/components/ui/sonner";
import ApproveLeaveRequest from "./features/manager/ApproveLeaveRequest";
import AttendanceHistoryPage from "./features/employee/AttendanceHistoryPage";
import AdjustmentRequestPage from "./features/employee/AdjustmentRequestPage";
import AssetManagementPage from "./features/admin/Asset-Management";
import AssetIncidentManagementPage from "./features/admin/AssetIncidentManagementPage";
import ApproveAdjustmentRequest from "./features/manager/ApproveAdjustmentRequest";
import MyAssetsPage from "./features/employee/MyAssetsPage";
import ManagerProfilePage from "./features/manager/ManagerProfilePage";
import HRProfilePage from "./features/hr/HRProfilePage";
import AdminProfilePage from "./features/admin/AdminProfilePage";
import KpiOkrManagement from "./features/manager/KpiOkrManagement";
import MemberList from "./features/manager/MemberList";
import PayrollManagement from "./features/hr/PayrollManagement";
import AssetReportManagement from "./features/admin/AssetReportManagement";
import AssetGroupManagement from "./features/manager/AssetGroupManagement";
import EmployeeManagement from "./features/hr/EmployeeManagement";
import SalaryHistoryPage from "./features/employee/SalaryHistoryPage";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                    {/* Admin only */}
                    <Route element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]} />}>
                        <Route path="/asset" element={<AssetManagementPage sidebarRole="admin" />} />
                        <Route path="/asset-reports" element={<AssetReportManagement />} />
                        <Route path="/admin-profile" element={<AdminProfilePage />} />
                        <Route path="/admin-my-assets" element={<MyAssetsPage sidebarRole="admin" />} />
                    </Route>


                    {/* Shared cross-roles: Admin + HR + Manager */}
                    <Route element={<ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_HR", "ROLE_MANAGER"]} />}>
                        <Route path="/asset-incidents" element={<AssetIncidentManagementPage />} />
                        <Route path="/asset-reports" element={<AssetReportManagement />} />
                    </Route>

                    {/* Check-in / Attendance shared across Employee, HR, Manager */}
                    <Route element={<ProtectedRoute allowedRoles={["ROLE_EMPLOYEE", "ROLE_HR", "ROLE_MANAGER"]} />}>
                        <Route path="/checkin" element={<CheckinPage />} />
                        <Route path="/attendance" element={<AttendanceHistoryPage />} />
                    </Route>

                    {/* Employee only */}
                    <Route element={<ProtectedRoute allowedRoles={["ROLE_EMPLOYEE"]} />}>
                        <Route path="/employee" element={<EmployeeDashboard />} />
                        <Route path="/salary-history" element={<SalaryHistoryPage />} />
                        <Route path="/request" element={<LeaveRequestPage />} />
                        <Route path="/adjustment-requests" element={<AdjustmentRequestPage />} />
                        <Route path="/my-assets" element={<MyAssetsPage />} />
                    </Route>

                    {/* Manager only */}
                    <Route element={<ProtectedRoute allowedRoles={["ROLE_MANAGER"]} />}>
                        <Route path="/manager-profile" element={<ManagerProfilePage />} />
                        <Route path="/members" element={<MemberList />} />
                        <Route path="/kpi-okr" element={<KpiOkrManagement />} />
                        <Route path="/approve" element={<ApproveLeaveRequest />} />
                        <Route path="/approve-adjustments" element={<ApproveAdjustmentRequest />} />
                        <Route path="/view-group-asset" element={<AssetGroupManagement />} />
                        <Route path="/manager-my-assets" element={<MyAssetsPage sidebarRole="manager" />} />
                    </Route>

                    {/* HR only */}
                    <Route element={<ProtectedRoute allowedRoles={["ROLE_HR"]} />}>
                        <Route path="/hr/employees" element={<Dashboard />} />
                        <Route path="/hr-profile" element={<HRProfilePage />} />
                        <Route path="/payroll" element={<PayrollManagement />} />
                        <Route path="/hr-my-assets" element={<MyAssetsPage sidebarRole="hr" />} />
                        <Route path="/hr-assets" element={<AssetManagementPage sidebarRole="hr" />} />
                        <Route path="/hr-employees" element={<EmployeeManagement />} />
                    </Route>

                </Routes>
            </BrowserRouter>
            <Toaster richColors position="top-right" />
        </AuthProvider>
    );
}

export default App;
