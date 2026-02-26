import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import Dashboard from "./features/admin/Dashboard";
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage";
import EmployeeDashboard from "./features/employee/EmployeeDashboard";
import LeaveRequestPage from "./features/employee/LeaveRequestPage";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import CheckinPage from "./features/employee/CheckinPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          {/* <Route element={<ProtectedRoute />}> */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/request" element={<LeaveRequestPage />} />
          <Route path="/checkin" element={<CheckinPage />} />

          {/* </Route> */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


export default App;