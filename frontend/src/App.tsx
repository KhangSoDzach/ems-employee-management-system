import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import Dashboard from "./features/admin/Dashboard";
import AddingPage from "./features/admin/AddingPage";
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage";
import EmployeeDashboard from "./features/employee/EmployeeDashboard";
import LeaveRequestPage from "./features/employee/LeaveRequestPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/employee" element={<EmployeeDashboard />} />
        <Route path="/request" element={<LeaveRequestPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;