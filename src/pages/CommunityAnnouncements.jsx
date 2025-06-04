import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import axios from "axios";
import useDesktopNotification from "../hooks/useDesktopNotification";
import io from 'socket.io-client';
import { motion } from "framer-motion";
import multiico from "../images/multiico.png";
import "../css/CommunityAnnouncements.css";

const CATEGORY_OPTIONS = [
  "Community Announcement",
  "Security",
  "Maintenance",
  "Flood",
  "Events",
  "Urgent",
  "Other",
];

export default function CommunityAnnouncements() {
  const notify = useDesktopNotification();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementImage, setAnnouncementImage] = useState(null);
  const [titleInput, setTitleInput] = useState("");
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  const [locationInput, setLocationInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [contactInput, setContactInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'https://communisafe-backend.onrender.com';
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "user";
  const token = localStorage.getItem("token");

  // --- Fetch announcements and listen to socket updates ---
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await axios.get(`${API_URL}/api/announcements`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setAnnouncements(res.data);
      } catch (error) {
        setError("Failed to fetch announcements");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();

    // --- Setup Socket.IO connection for real-time updates ---
    const socket = io(API_URL, {
      auth: { token }
    });

    socket.on('newAnnouncement', (newAnnouncement) => {
      setAnnouncements(prev => [newAnnouncement, ...prev]);
    });

    socket.on('announcementUpdated', (updatedAnnouncement) => {
      setAnnouncements(prev =>
        prev.map(announcement =>
          announcement._id === updatedAnnouncement._id ? updatedAnnouncement : announcement
        )
      );
    });

    socket.on('announcementDeleted', (deletedId) => {
      setAnnouncements(prev =>
        prev.filter(announcement => announcement._id !== deletedId)
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [token, API_URL]);

  // --- Group announcements dynamically by category ---
  const groupedAnnouncements = {};
  CATEGORY_OPTIONS.forEach(cat => { groupedAnnouncements[cat] = []; });
  announcements
    .filter((a) => {
      const matchesCategory = selectedCategory === "All" || a.category === selectedCategory;
      const matchesSearch =
        (a.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (a.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .forEach((a) => {
      const group = a.category && CATEGORY_OPTIONS.includes(a.category) ? a.category : "Other";
      groupedAnnouncements[group].push(a);
    });

  // --- Post or update announcement ---
  const handlePostAnnouncement = async () => {
    if (!titleInput || !announcementText) {
      setError("Title and description are required");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append("title", titleInput);
      formData.append("description", announcementText);
      formData.append("category", categoryInput || "Community Announcement");
      formData.append("location", locationInput);
      formData.append("date", dateInput);
      formData.append("time", timeInput);
      formData.append("contact", contactInput);
      if (announcementImage) {
        formData.append("image", announcementImage);
      }

      let res;
      if (editingAnnouncement) {
        res = await axios.put(
          `${API_URL}/api/announcements/${editingAnnouncement._id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`
            }
          }
        );
        setAnnouncements(prev =>
          prev.map(item =>
            item._id === editingAnnouncement._id ? res.data.data : item
          )
        );
        notify({
          title: "Announcement Updated",
          body: res.data.data.title,
          icon: "/favicon.ico",
          url: "/community-announcements",
        });
      } else {
        res = await axios.post(
          `${API_URL}/api/announcements`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`
            }
          }
        );
        setAnnouncements([res.data.data, ...announcements]);
        notify({
          title: "New Community Announcement",
          body: res.data.data.title,
          icon: "/favicon.ico",
          url: "/community-announcements",
        });
      }

      setShowModal(false);
      setEditingAnnouncement(null);
      setTitleInput("");
      setAnnouncementText("");
      setAnnouncementImage(null);
      setLocationInput("");
      setDateInput("");
      setTimeInput("");
      setContactInput("");
      setCategoryInput("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post announcement");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showModal && !editingAnnouncement) {
      const now = new Date();
      setDateInput(now.toISOString().split("T")[0]);
      setTimeInput(now.toTimeString().slice(0,5));
    }
  }, [showModal, editingAnnouncement]);

  // --- Group announcements: Urgent first, then others ---
  const filteredAnnouncements = announcements
    .filter((a) => {
      const matchesCategory = selectedCategory === "All" || a.category === selectedCategory;
      const matchesSearch =
        (a.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (a.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      // Urgent first
      if (a.category === "Urgent" && b.category !== "Urgent") return -1;
      if (a.category !== "Urgent" && b.category === "Urgent") return 1;
      // Newest first
      return new Date(b.date) - new Date(a.date);
    });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-4 shadow-sm bg-white">
        <button onClick={() => setDrawerOpen(true)} className="text-gray-600">
          <FiMenu size={24} />
        </button>
        <h1 className="text-xl font-semibold text-green-600">
          Community Announcements
        </h1>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search"
            className="px-3 py-1 border rounded-md shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Category Filter */}
          <select
            className="px-2 py-1 border rounded-md shadow-sm text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <>
          <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50 p-6">
            <div className="mb-8">
              <h2 className="font-bold text-lg mb-2">Menu</h2>
              <div
                onClick={() => {
                  navigate("/dashboard");
                  setDrawerOpen(false);
                }}
                className="flex items-center gap-2 text-green-600 font-bold text-xl cursor-pointer hover:underline"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 12l9-9 9 9h-3v9H6v-9H3z" />
                </svg>
                <span>Dashboard</span>
              </div>
            </div>
            <nav className="space-y-3 text-sm font-medium text-gray-600">
              <div
                onClick={() => {
                  navigate("/dashboard");
                  setDrawerOpen(false);
                }}
                className="cursor-pointer hover:text-green-600"
              >
                Dashboard
              </div>
              <div className="text-green-600">Community Announcements</div>
              <div
                onClick={() => {
                  navigate("/flood-tracker");
                  setDrawerOpen(false);
                }}
                className="cursor-pointer hover:text-green-600"
              >
                Flood Tracker
              </div>
              <div
                onClick={() => {
                  navigate("/incidentreport");
                  setDrawerOpen(false);
                }}
                className="cursor-pointer hover:text-green-600"
              >
                Incident Report
              </div>
              <div
                onClick={() => {
                  navigate("/visitorManagement");
                  setDrawerOpen(false);
                }}
                className="cursor-pointer hover:text-green-600"
              >
                Visitor Management
              </div>
            </nav>
          </aside>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setDrawerOpen(false)}
          />
        </>
      )}

      {/* Main */}
      <main className="p-6 space-y-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <p className="text-lg font-semibold text-gray-700">
          Good morning,{" "}
          {role === "official"
            ? "Admin"
            : role === "security"
            ? "Security"
            : "Resident"}
          !
        </p>

        {role === "official" && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowModal(true);
                setEditingAnnouncement(null);
                setTitleInput("");
                setAnnouncementText("");
                setAnnouncementImage(null);
                setLocationInput("");
                setDateInput("");
                setTimeInput("");
                setContactInput("");
                setCategoryInput("");
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md"
            >
              + Post Announcement
            </button>
          </div>
        )}

        {/* Grouped Announcements by Category */}
        <div className="announcements-list">
          {filteredAnnouncements
            // Remove duplicates by _id
            .filter((a, idx, arr) => arr.findIndex(x => x._id === a._id) === idx)
            .map((a) => (
              <motion.div
                key={a._id}
                className="announcement-horizontal-card"
                whileHover={{ scale: 1.02, boxShadow: "0 8px 32px #388e3c33" }}
                onClick={() => setActiveAnnouncement(a)}
                style={{
                  border: a.category === "Urgent" ? "3px solid #e53935" : "3px solid #388e3c",
                  background: a.category === "Urgent" ? "#fff5f5" : "#fff"
                }}
              >
                <div className="announcement-horizontal-img">
                  <img
                    src={a.image ? `${API_URL}/api/uploads/${a.image}` : multiico}
                    alt={a.title}
                    className="announcement-img-el"
                  />
                </div>
                <div className="announcement-horizontal-content">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="announcement-horizontal-title">{a.title}</h2>
                    {a.category === "Urgent" && (
                      <span className="urgent-badge">URGENT</span>
                    )}
                  </div>
                  <p className="announcement-horizontal-desc">{a.description}</p>
                  <div className="announcement-horizontal-meta">
                    <span>
                      {a.date && !isNaN(new Date(a.date))
                        ? new Date(a.date).toLocaleDateString()
                        : (a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "No Date")}
                      {a.time && <> • {a.time}</>}
                    </span>
                    {a.location && (
                      <span className="ml-3 text-gray-500">📍 {a.location}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </main>

      {/* Active Announcement Modal */}
      {activeAnnouncement && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center"
          onClick={() => setActiveAnnouncement(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-4 text-2xl text-gray-500 hover:text-black"
              onClick={() => setActiveAnnouncement(null)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold text-green-700 mb-1">
              {activeAnnouncement.title}
            </h2>
            <p className="text-sm text-gray-600 mb-3 font-medium">
              {activeAnnouncement.category}
            </p>
            <div className="space-y-1 text-sm text-gray-700 mb-4">
              {activeAnnouncement.location && (
                <p>
                  📍 <span className="font-semibold">Location:</span>{" "}
                  {activeAnnouncement.location}
                </p>
              )}
              {activeAnnouncement.time && (
                <p>
                  ⏰ <span className="font-semibold">Time:</span>{" "}
                  {activeAnnouncement.time}
                </p>
              )}
              {activeAnnouncement.date && (
                <p>
                  📅 <span className="font-semibold">Date:</span>{" "}
                  {activeAnnouncement.date}
                </p>
              )}
            </div>
            <div className="whitespace-pre-line text-gray-800 text-sm mb-4">
              {activeAnnouncement.description}
            </div>
            {activeAnnouncement.image && (
              <img
                src={`${API_URL}/api/uploads/${activeAnnouncement.image}`}
                alt={activeAnnouncement.title}
                className="w-full max-h-96 object-cover rounded-md shadow mb-3"
              />
            )}
            <p className="text-xs text-gray-400">
              {activeAnnouncement.timestamp || activeAnnouncement.date}
            </p>
            {/* EDIT/DELETE BUTTONS FOR OFFICIAL */}
            {role === "official" && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setTitleInput(activeAnnouncement.title);
                    setAnnouncementText(activeAnnouncement.description);
                    setLocationInput(activeAnnouncement.location);
                    setDateInput(activeAnnouncement.date);
                    setTimeInput(activeAnnouncement.time);
                    setCategoryInput(activeAnnouncement.category);
                    setAnnouncementImage(null);
                    setEditingAnnouncement(activeAnnouncement);
                    setShowModal(true);
                    setActiveAnnouncement(null);
                  }}
                  className="btn-edit"
                >
                   Edit
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to delete this announcement?")) {
                      await axios.delete(
                        `${API_URL}/api/announcements/${activeAnnouncement._id}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      setAnnouncements((prev) =>
                        prev.filter((item) => item._id !== activeAnnouncement._id)
                      );
                      setActiveAnnouncement(null);
                    }
                  }}
                  className="btn-delete"
                >
                   Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-xl relative shadow-lg">
            <button
              className="absolute top-3 right-4 text-2xl text-gray-400 hover:text-black"
              onClick={() => {
                setShowModal(false);
                setEditingAnnouncement(null);
              }}
              disabled={isLoading}
            >
              &times;
            </button>
            <div className="flex items-center gap-3 mb-4">
              <img src={multiico} alt="icon" className="w-10 h-10" />
              <h2 className="text-2xl font-bold text-green-700">
                {editingAnnouncement ? "Update Announcement" : "Post Announcement"}
              </h2>
            </div>
            <input
              type="text"
              placeholder="Enter Title..."
              className="w-full border p-3 rounded-md mb-3 text-lg font-semibold"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
            />
            <select
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              className="w-full border p-3 rounded-md mb-3 text-base"
              required
            >
              <option value="">Select Category</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <textarea
              rows={5}
              placeholder="Write Announcement..."
              className="w-full border p-3 rounded-md mb-3 text-base"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
            />
            <input
              type="text"
              placeholder="Location..."
              className="w-full border p-3 rounded-md mb-3"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
            />
            <div className="flex gap-3 mb-3">
              <input
                type="date"
                className="border p-3 rounded-md flex-1"
                value={dateInput}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDateInput(e.target.value)}
              />
              <input
                type="time"
                className="border p-3 rounded-md flex-1"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 mb-3 cursor-pointer text-base">
              <input
                type="checkbox"
                checked={categoryInput === "Urgent"}
                onChange={e => setCategoryInput(e.target.checked ? "Urgent" : "")}
              />
              Mark as Urgent
            </label>
            <label className="flex items-center gap-2 mb-3 cursor-pointer text-base text-blue-600">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setAnnouncementImage(e.target.files[0])}
              />
              <span className="bg-blue-100 px-3 py-1 rounded">Add Image</span>
            </label>
            {announcementImage && (
              <img
                src={URL.createObjectURL(announcementImage)}
                alt="Preview"
                className="w-full h-56 object-cover rounded-md mb-3"
              />
            )}
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={handlePostAnnouncement}
                className="bg-green-600 text-white px-6 py-3 rounded-md text-lg font-bold hover:bg-green-700 w-full"
                disabled={isLoading}
              >
                {isLoading ? "Posting..." : editingAnnouncement ? "UPDATE" : "POST ANNOUNCEMENT"}
              </button>
            </div>
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-xl">
                <span className="text-green-700 font-bold text-lg">Posting...</span>
              </div>
            )}
            {error && (
              <div className="text-red-600 text-center mt-3">{error}</div>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            Loading...
          </div>
        </div>
      )}
    </div>
  );
}
