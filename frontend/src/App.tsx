import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import Dashboard from "./features/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;