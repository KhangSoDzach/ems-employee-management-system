import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import Dashboard from "./features/Dashboard";
import AddingPage from "./features/admin/AddingPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/adding" element={<AddingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;