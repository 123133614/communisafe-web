import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import io from "socket.io-client";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PendingApproval from "./pages/PendingApproval";
import Dashboard from "./pages/Dashboard";
import CommunityAnnouncements from "./pages/CommunityAnnouncements";
import FloodTracker from "./pages/FloodTracker";
import IncidentReport from "./pages/IncidentReport";
import VisitorManagement from "./pages/VisitorManagement";
import ForgotPassword from "./pages/ForgotPassword";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import PersonalInfo from "./pages/PersonalInfo";
import Settings from "./pages/Settings";
import EditProfile from './pages/EditProfile';
import AdminManagement from "./pages/AdminManagement";
import Notifications from './pages/Notifications';
import ResidentVisitorRequests from "./pages/ResidentVisitorRequests";
import ProtectedRoute from "./components/ProtectedRoute";



// 🔌 Global socket connection
const socket = io("https://communisafe-backend.onrender.com", {
  path: "/socket.io/",
  transports: ["websocket", "polling"],
});

function App() {
  useEffect(() => {
    socket.on("newNotification", (data) => {
      console.log("Global Notification Received:", data);

      // Optional: store in localStorage to display red dot in header
      localStorage.setItem("hasNewNotification", "true");

      // Optional: trigger toast/popup if you have a UI lib like react-toastify
    });

    return () => socket.off("newNotification");
  }, []);

  return (
    <Router>
      <Routes>
         <Route path="/notifications" element={<Notifications />} />
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pending" element={<PendingApproval />} />
        <Route path="/home" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/announcements" element={<CommunityAnnouncements />} />
        <Route path="/flood-tracker" element={<FloodTracker />} />
        <Route path="/incidentreport" element={<IncidentReport />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/superadmin/admin-management" element={<AdminManagement />} />
        <Route path="/incidentreport/:id" element={<IncidentReport />} /> 
        <Route path="/personal-info" element={<PersonalInfo />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/edit-profile" element={<EditProfile />} />
       
       <Route
  path="/visitorManagement"
  element={
    <ProtectedRoute allowedRoles={["official", "admin", "security"]}>
      <VisitorManagement />
    </ProtectedRoute>
  }
/>
<Route
  path="/visitor-requests"
  element={
    <ProtectedRoute allowedRoles={["resident"]}>
      <ResidentVisitorRequests />
    </ProtectedRoute>
  }
/>
      </Routes>
    </Router>
  );
}

export default App;
