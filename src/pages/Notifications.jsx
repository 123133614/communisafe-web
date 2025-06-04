import { useEffect, useState } from "react";
import { FiBell, FiAlertCircle, FiUsers, FiShield, FiTrash2 } from "react-icons/fi";
import { FaBullhorn, FaWater } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import API from "../api";

dayjs.extend(relativeTime);

const getNotificationIcon = (type) => {
  switch (type) {
    case "announcement":
      return <FaBullhorn className="text-green-500" size={24} />;
    case "visitor":
      return <FiUsers className="text-blue-500" size={24} />;
    case "flood":
      return <FaWater className="text-yellow-500" size={24} />;
    case "incident":
      return <FiAlertCircle className="text-red-500" size={24} />;
    case "security":
      return <FiShield className="text-purple-500" size={24} />;
    default:
      return <FiBell className="text-gray-500" size={24} />;
  }
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/notifications");
      setNotifications(res.data.notifications || []);
    } catch {
      setNotifications([]);
    }
    setLoading(false);
  };

  // Get user role from localStorage on mount
  useEffect(() => {
    fetchNotifications();
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUserRole(parsed.role);
      } catch {}
    }
  }, []);

  const markAsRead = async (id) => {
    await API.post(`/api/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = async (id) => {
    await API.delete(`/api/notifications/${id}`);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setDeleteId(null);
  };

  const clearAll = async () => {
    setClearing(true);
    await API.delete("/api/notifications/clear-all");
    setNotifications([]);
    setClearing(false);
    setShowConfirm(false);
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) await markAsRead(notif._id);

    switch (notif.type) {
      case "announcement":
        navigate(`/announcements/${notif.targetId}`);
        break;
      case "visitor":
        if (userRole === "resident") {
          navigate(`/visitor-requests/${notif.targetId}`);
        } else if (userRole === "official" || userRole === "security" || userRole === "admin") {
          navigate(`/visitorManagement/${notif.targetId}`);
        }
        break;
      case "flood":
        navigate(`/flood-tracker`);
        break;
      case "incident":
        navigate(`/incidentreport`); // <--- Ito lang, walang id!
        break;
      case "security":
        navigate(`/security-updates/${notif.targetId}`);
        break;
      default:
        break;
    }
  };

  // Sidebar (from VisitorManagement)
  const sidebar = (
    <div className="w-64 bg-white border-r p-4 flex flex-col min-h-screen shadow-lg z-10">
      <h2 className="text-lg font-bold mb-6 text-green-600">Menu</h2>
      <nav className="space-y-2 text-sm font-medium">
        <div
          onClick={() => navigate("/dashboard")}
          className="cursor-pointer hover:text-green-600 p-2 rounded transition"
        >
          Dashboard
        </div>
        <div
          onClick={() => navigate("/announcements")}
          className="cursor-pointer hover:text-green-600 p-2 rounded transition"
        >
          Community Announcements
        </div>
        <div
          onClick={() => navigate("/flood-tracker")}
          className="cursor-pointer hover:text-green-600 p-2 rounded transition"
        >
          Flood Tracker
        </div>
        <div
          onClick={() => navigate("/incidentreport")}
          className="cursor-pointer hover:text-green-600 p-2 rounded transition"
        >
          Incident Report
        </div>
        <a className="block text-green-600 font-bold bg-green-50 p-2 rounded">
          Notifications
        </a>
      </nav>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen w-full bg-white">
        {sidebar}
        <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
          <FiBell size={48} className="text-green-400 mb-4 animate-bounce" />
          <span className="text-gray-500">Loading notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-white">
      {sidebar}
      <div className="flex-1 flex flex-col items-center justify-start py-10 px-4 bg-white relative">
        <div className="flex justify-between items-center mb-6 w-full max-w-xl">
          <h2 className="text-2xl font-bold text-green-700 tracking-tight flex items-center gap-2">
            <FiBell className="text-green-500" /> Notifications
          </h2>
          <button
            onClick={() => setShowConfirm(true)}
            className="text-red-500 hover:underline transition"
            disabled={clearing}
          >
            {clearing ? "Clearing..." : "Clear All"}
          </button>
        </div>
        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="mb-4 text-lg font-semibold">Clear All Notifications?</div>
              <div className="mb-6 text-gray-600">This action cannot be undone.</div>
              <div className="flex gap-4 justify-center">
                <button
                  className="bg-gray-200 px-4 py-2 rounded"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded"
                  onClick={clearAll}
                  disabled={clearing}
                >
                  Yes, Clear All
                </button>
              </div>
            </div>
          </div>
        )}
        {deleteId && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="mb-4 text-lg font-semibold">Delete this notification?</div>
              <div className="mb-6 text-gray-600">This action cannot be undone.</div>
              <div className="flex gap-4 justify-center">
                <button
                  className="bg-gray-200 px-4 py-2 rounded"
                  onClick={() => setDeleteId(null)}
                >
                  Cancel
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded"
                  onClick={() => deleteNotification(deleteId)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        {notifications.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <img
              src="/assets/images/empty-notifications.png"
              alt="No notifications"
              className="mx-auto mb-4 w-32 h-32 opacity-80"
              style={{ filter: "grayscale(0.2)" }}
            />
            <div className="font-semibold text-lg mb-1">No notifications yet</div>
            <div className="text-gray-400">We'll notify you when something important happens</div>
          </div>
        ) : (
          <ul className="space-y-4 w-full max-w-xl">
            {notifications.map((notif, idx) => (
              <li
                key={notif._id}
                className={`flex items-start gap-4 p-4 rounded-xl shadow transition-all duration-200 cursor-pointer border bg-white hover:scale-[1.02] hover:shadow-lg ${
                  !notif.read
                    ? "border-green-400 bg-green-50 animate-fade-in"
                    : "border-gray-200"
                }`}
                style={{ animationDelay: `${idx * 40}ms` }}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="mt-1 relative">
                  {getNotificationIcon(notif.type)}
                  {!notif.read && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-base">{notif.title}</div>
                  <div className="text-gray-600 text-sm">{notif.body}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {dayjs(notif.createdAt).fromNow()}
                  </div>
                </div>
                <button
                  className="ml-2 text-gray-400 hover:text-red-500 transition"
                  onClick={e => {
                    e.stopPropagation();
                    setDeleteId(notif._id);
                  }}
                  title="Delete"
                >
                  <FiTrash2 size={20} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

