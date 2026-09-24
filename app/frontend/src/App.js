import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Events from "@/pages/Events";
import Volunteers from "@/pages/Volunteers";
import Projects from "@/pages/Projects";
import Partners from "@/pages/Partners";
import Donations from "@/pages/Donations";
import Impact from "@/pages/Impact";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import PublicOrg from "@/pages/PublicOrg";

function Protected({ children }) {
  const { user } = useAuth();
  if (user === null) return <div className="min-h-screen grid place-items-center text-[#64748B]">Loading...</div>;
  if (user === false) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/org/:slug" element={<PublicOrg />} />
          <Route path="/app" element={<Protected><Layout /></Protected>}>
            <Route index element={<Dashboard />} />
            <Route path="events" element={<Events />} />
            <Route path="volunteers" element={<Volunteers />} />
            <Route path="projects" element={<Projects />} />
            <Route path="partners" element={<Partners />} />
            <Route path="donations" element={<Donations />} />
            <Route path="impact" element={<Impact />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
