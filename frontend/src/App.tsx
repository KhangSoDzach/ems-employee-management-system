import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import Dashboard from "./features/Dashboard";
import AddingPage from "./features/admin/AddingPage";
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage";
import LeaveRequestPage from "./features/employee/LeaveRequestPage";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/adding" element={<AddingPage />} />
            <Route path="/request" element={<LeaveRequestPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;