import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import Dashboard from "./features/admin/Dashboard";
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage";
import EmployeeDashboard from "./features/employee/EmployeeDashboard";
import LeaveRequestPage from "./features/employee/LeaveRequestPage";
import { AuthProvider } from "@/contexts/AuthContext";
// import { ProtectedRoute } from "@/components/ProtectedRoute";
import CheckinPage from "./features/employee/CheckinPage";
import { Toaster } from "@/components/ui/sonner";
import ApproveLeaveRequest from "./features/manager/ApproveLeaveRequest";
import AttendanceHistoryPage from "./features/employee/AttendanceHistoryPage";
import AdjustmentRequestPage from "./features/employee/AdjustmentRequestPage";
import AssetManagementPage from "./features/admin/Asset-Management";
import AssetIncidentManagementPage from "./features/admin/AssetIncidentManagementPage";
import ApproveAdjustmentRequest from "./features/manager/ApproveAdjustmentRequest";
import MyAssetsPage from "./features/employee/MyAssetsPage";
import KpiOkrManagement from "./features/manager/KpiOkrManagement";
import MemberList from "./features/manager/MemberList";
import PayrollManagement from "./features/hr/PayrollManagement";
import AssetReportManagement from "./features/admin/AssetReportManagement";
import AssetGroupManagement from "./features/manager/AssetGroupManagement";
import EmployeeManagement from "./features/hr/EmployeeManagement";
import SalaryHistoryPage from "./features/employee/SalaryHistoryPage";
import ProfilePage from "./components/ProfilePage";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

    {/* Shared cross-roles: Admin + HR + Manager */}
                    {/* <Route element={<ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_HR", "ROLE_MANAGER"]} />}> */}
                        <Route path="/asset-incidents" element={<AssetIncidentManagementPage />} />
                        <Route path="/asset-reports" element={<AssetReportManagement />} />
                        <Route path="/hr-employees" element={<EmployeeManagement />} />
                        <Route path="/payroll" element={<PayrollManagement />} />
                    {/* </Route> */}

                    {/* Shared Admin + HR */}
                    {/* <Route element={<ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_HR"]} />}> */}
                        <Route path="/assets" element={<AssetManagementPage />} />
                    {/* </Route> */}

                    {/* Profile + My Assets: tất cả 4 roles */}
                    {/* <Route element={<ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_HR", "ROLE_MANAGER", "ROLE_EMPLOYEE"]} />}> */}
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/my-assets" element={<MyAssetsPage />} />
                    {/* </Route> */}

                    {/* Check-in / Attendance / Adjustment shared: Employee, HR, Manager */}
                    {/* <Route element={<ProtectedRoute allowedRoles={["ROLE_EMPLOYEE", "ROLE_HR", "ROLE_MANAGER"]} />}> */}
                        <Route path="/checkin" element={<CheckinPage />} />
                        <Route path="/attendance" element={<AttendanceHistoryPage />} />
                        <Route path="/adjustment-requests" element={<AdjustmentRequestPage />} />
                    {/* </Route> */}

                    {/* Employee only */}
                    {/* <Route element={<ProtectedRoute allowedRoles={["ROLE_EMPLOYEE"]} />}> */}
                        <Route path="/employee" element={<EmployeeDashboard />} />
                        <Route path="/salary-history" element={<SalaryHistoryPage />} />
                        <Route path="/request" element={<LeaveRequestPage />} />
                    {/* </Route> */}

                    {/* Manager only */}
                    {/* <Route element={<ProtectedRoute allowedRoles={["ROLE_MANAGER"]} />}> */}
                        <Route path="/members" element={<MemberList />} />
                        <Route path="/kpi-okr" element={<KpiOkrManagement />} />
                        <Route path="/approve" element={<ApproveLeaveRequest />} />
                        <Route path="/approve-adjustments" element={<ApproveAdjustmentRequest />} />
                        <Route path="/view-group-asset" element={<AssetGroupManagement />} />
                    {/* </Route> */}

                    {/* HR only */}
                    {/* <Route element={<ProtectedRoute allowedRoles={["ROLE_HR"]} />}> */}
                        <Route path="/hr/employees" element={<Dashboard />} />
                    {/* </Route> */}

                </Routes>
            </BrowserRouter>
            <Toaster richColors position="top-right" />
        </AuthProvider>
    );
}

export default App;
