import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import Dashboard from "./features/admin/Dashboard";
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage";
import EmployeeDashboard from "./features/employee/EmployeeDashboard";
import LeaveRequestPage from "./features/employee/LeaveRequestPage";
import { AuthProvider } from "@/contexts/AuthContext";
import CheckinPage from "./features/employee/CheckinPage";
import AttendanceHistoryPage from "./features/employee/AttendanceHistoryPage";
// import { ProtectedRoute } from "@/components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected: must be logged in */}
          {/* <Route element={<ProtectedRoute />}> */}

          {/* Admin only */}
          <Route path="/admin" element={<Dashboard />} />

          {/* Employee only */}
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/request" element={<LeaveRequestPage />} />
          <Route path="/checkin" element={<CheckinPage />} />
          <Route path="/attendance" element={<AttendanceHistoryPage />} />
          {/* </Route> */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;