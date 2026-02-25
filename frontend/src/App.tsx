import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import Dashboard from "./features/Dashboard";
import AddingPage from "./features/admin/AddingPage";
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage";
import LeaveRequestPage from "./features/employee/LeaveRequestPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/adding" element={<AddingPage />} />
          <Route path="/forgot" element={<ForgotPasswordPage />} />
            <Route path="/request" element={<LeaveRequestPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;