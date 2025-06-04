import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaBullhorn,
  FaUserFriends,
  FaFileAlt,
  FaWater,
  FaHome,
} from "react-icons/fa";
import { FiBell, FiUser, FiEdit2 } from "react-icons/fi";
import axios from "axios";

import "../css/Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    role: "",
  });
  const userRole = localStorage.getItem("role") || "guest";

  // ─── Clock State ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const timeString = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateString = currentTime.toLocaleDateString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  // ────────────────────────────────────────────────────────────────────────────

  // ─── Auth Check ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      navigate("/login");
      return;
    }
    axios
      .get(`https://communisafe-backend.onrender.com/api/auth/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.status !== "active") {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/pending");
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/login");
      });
  }, [navigate]);
  // ────────────────────────────────────────────────────────────────────────────

  // ─── Load User Info from localStorage ─────────────────────────────────────────
  useEffect(() => {
    setUserInfo({
      name: localStorage.getItem("name") || "Unknown",
      email: localStorage.getItem("email") || "No Email",
      role: localStorage.getItem("role") || "guest",
    });
  }, []);
  // ────────────────────────────────────────────────────────────────────────────

  const greeting =
    userInfo.role === "official"
      ? "Admin"
      : userInfo.role === "security"
      ? "Security"
      : userInfo.role === "resident"
      ? "User"
      : "Guest";

  // ─── Sidebar Menu Items ───────────────────────────────────────────────────────
  const menuItems = [
    {
      label: "Dashboard",
      icon: <FaHome size={20} />,
      route: "/dashboard",
    },
    {
      label: "Community Announcements",
      icon: <FaBullhorn size={20} />,
      route: "/announcements",
    },
    {
      label: "Flood Tracker",
      icon: <FaWater size={20} />,
      route: "/flood-tracker",
    },
    {
      label: "Incident Report",
      icon: <FaFileAlt size={20} />,
      route: "/incidentreport",
    },
    {
      label: "Visitor Management",
      icon: <FaUserFriends size={20} />,
      route:
        userRole === "resident" ? "/visitor-requests" : "/visitorManagement",
    },
  ];
  // ────────────────────────────────────────────────────────────────────────────

  // ─── Dashboard Cards (2×2 ordering) ───────────────────────────────────────────
  // We want: 
  //   Row 1: Community (left), Flood (right)
  //   Row 2: Visitor (left), Incident (right)
  const cardItems = [
    {
      label: "Community Announcements",
      icon: <FaBullhorn size={36} />,
      color: "from-green-400 to-green-600",
      route: "/announcements",
    },
    {
      label: "Flood Tracker",
      icon: <FaWater size={36} />,
      color: "from-blue-400 to-blue-600",
      route: "/flood-tracker",
    },
    {
      label: "Visitor Management",
      icon: <FaUserFriends size={36} />,
      color: "from-purple-400 to-purple-600",
      route:
        userRole === "resident"
          ? "/visitor-requests"
          : "/visitorManagement",
    },
    {
      label: "Incident Report",
      icon: <FaFileAlt size={36} />,
      color: "from-yellow-400 to-yellow-600",
      route: "/incidentreport",
    },
  ];
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="dashboard-container">
      {/* ─── Static Sidebar ────────────────────────────────────────────────────── */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          {/* multico.png must live in public/ as /multico.png */}
          <img
            src="/multico.png"
            alt="CommuniSafe Logo"
            className="sidebar-logo"
          />
          <span className="sidebar-brand">CommuniSafe</span>
        </div>

        <h2 className="sidebar-title">Menu</h2>
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.route;
            return (
              <div
                key={item.label}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                onClick={() => navigate(item.route)}
              >
                <div className="sidebar-icon-wrapper">{item.icon}</div>
                <span className="sidebar-link-text">{item.label}</span>
              </div>
            );
          })}
        </nav>
      </aside>
      {/* ──────────────────────────────────────────────────────────────────────────── */}

      {/* ─── Main Content ─────────────────────────────────────────────────────────── */}
      <div className="dashboard-main-content">
        {/* ─── Top Bar ────────────────────────────────────────────────────────────── */}
        <header className="topbar-container">
          <h1 className="topbar-title">Welcome, {greeting}!</h1>
          <div className="topbar-right">
            <div
              onClick={() => navigate("/notifications")}
              className="icon-button"
              title="Notifications"
            >
              <FiBell size={24} />
            </div>
            <div
              onClick={() => setShowProfileModal(true)}
              className="icon-button user-icon"
              title="Profile"
            >
              <FiUser size={24} />
            </div>
            <div className="clock-inline">
              <div className="clock-time">{timeString}</div>
              <div className="clock-date">{dateString}</div>
            </div>
          </div>
        </header>
        {/* ──────────────────────────────────────────────────────────────────────────── */}

        {/* ─── 2×2 Cards Grid ───────────────────────────────────────────────────────── */}
        <main className="dashboard-main">
          <div className="dashboard-cards">
            {cardItems.map((item) => (
              <div
                key={item.label}
                className={`dashboard-card bg-white/60 backdrop-blur-lg border border-gray-200 shadow-xl rounded-2xl text-center p-8 transition-all duration-300 hover:bg-gradient-to-br ${item.color} hover:text-white`}
                onClick={() => navigate(item.route)}
              >
                <div className="flex justify-center mb-4">
                  <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/40 shadow-lg mb-2 text-3xl">
                    {item.icon}
                  </span>
                </div>
                <p className="dashboard-card-title">{item.label}</p>
              </div>
            ))}
          </div>
        </main>
        {/* ──────────────────────────────────────────────────────────────────────────── */}

        {/* ─── Profile Modal ───────────────────────────────────────────────────────── */}
        {showProfileModal && (
          <div
            className="profile-modal"
            onClick={() => setShowProfileModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="profile-modal-content"
            >
              <div className="profile-header">
                <div className="profile-avatar">
                  <img
                    src={
                      localStorage.getItem("profileImage") ||
                      "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                    }
                    alt="Profile"
                  />
                </div>
                <div className="profile-info">
                  <h2>{userInfo.name}</h2>
                  <p>{userInfo.email}</p>
                  <span className="profile-role">
                    🟢{" "}
                    {userInfo.role.charAt(0).toUpperCase() +
                      userInfo.role.slice(1)}
                  </span>
                </div>
              </div>

              <div className="profile-options">
                <div
                  className="profile-option"
                  onClick={() => {
                    setShowProfileModal(false);
                    navigate("/personal-info");
                  }}
                >
                  <FiEdit2 className="profile-option-icon" />
                  <span className="profile-option-text">
                    Personal Information
                  </span>
                </div>
                <div
                  className="profile-option"
                  onClick={() => {
                    setShowProfileModal(false);
                    navigate("/settings");
                  }}
                >
                  <FiEdit2 className="profile-option-icon" />
                  <span className="profile-option-text">Settings</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ──────────────────────────────────────────────────────────────────────────── */}
      </div>
      {/* ──────────────────────────────────────────────────────────────────────────── */}
    </div>
  );
}
