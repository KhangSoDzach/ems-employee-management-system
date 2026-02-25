import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import Dashboard from "./features/Dashboard";
import AddingPage from "./features/admin/AddingPage";
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage";
import EmployeeDashboard from "./features/employee/EmployeeDashboard";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/adding" element={<AddingPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/employee" element={<EmployeeDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;