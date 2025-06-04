import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FiMenu, FiPlus, FiFilter } from "react-icons/fi";
import { FaPhoneAlt, FaLightbulb, FaBullhorn, FaUserFriends, FaFileAlt, FaWater, FaShieldAlt, FaHospitalAlt, FaFireExtinguisher } from "react-icons/fa";import { MdLocalPolice } from "react-icons/md";
import useDesktopNotification from "../hooks/useDesktopNotification";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import multiico from "../images/multiico.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const HOTLINES = [
  { name: "Barangay Moonwalk", number: "0945-771-5035", icon: <FaShieldAlt className="text-green-600" /> },
  { name: "Parañaque PNP", number: "0998-598-7926", icon: <MdLocalPolice className="text-blue-600" /> },
  { name: "Ospital ng Parañaque", number: "8825-4902", icon: <FaHospitalAlt className="text-red-600" /> },
  { name: "Parañaque BFP", number: "8826-9131", icon: <FaFireExtinguisher className="text-orange-600" /> },
];

export default function IncidentReport() {
  const { id } = useParams();
  const notify = useDesktopNotification();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewModal, setPreviewModal] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [mapModalIncident, setMapModalIncident] = useState(null);
  const [respondingId, setRespondingId] = useState(null); // Add this state
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    contactNumber: "",
    date: "",
    type: "",
    location: "",
    description: "",
    image: null,
    latitude: null,
    longitude: null,
  });

  const [incidents, setIncidents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const name = localStorage.getItem("name");
    const contactNumber = localStorage.getItem("contactNumber");
    const role = localStorage.getItem("role");

    setFormData((prev) => ({
      ...prev,
      name: name || "",
      contactNumber: contactNumber || "",
      date: new Date().toISOString().slice(0, 10),
    }));
    setUserRole(role || "");

    // Get geolocation for incident post
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }));
        },
        () => {
          // If denied, leave as null
        }
      );
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("https://communisafe-backend.onrender.com/api/incidents", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setIncidents(res.data))
      .catch((err) => console.error("Error fetching incidents:", err));
  }, []);

  // Only fetch a specific incident if there's an id in the URL
  useEffect(() => {
    if (!id) {
      setIncident(null);
      setLoading(false);
      return;
    }
    const fetchIncident = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`https://communisafe-backend.onrender.com/api/incidents/${id}`);
        setIncident(res.data.incident);
      } catch (err) {
        setIncident(null);
      }
      setLoading(false);
    };
    fetchIncident();
  }, [id]);

  const handleAddIncident = async () => {

    if (
    !formData.name ||
    !formData.contactNumber ||
    !formData.date ||
    !formData.type ||
    !formData.location ||
    !formData.description ||
    !formData.image ||
    (Array.isArray(formData.image) && formData.image.length === 0)
  ) {
    alert("Please fill out all fields and attach at least one photo.");
    return;
  }

    let latitude = formData.latitude;
    let longitude = formData.longitude;
    if (!latitude || !longitude) {
    latitude = 14.594891;
    longitude = 120.978261;


  }
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "image" && value) form.append(key, value);
      });
      if (formData.image && Array.isArray(formData.image)) {
        formData.image.forEach(file => form.append("photos", file));
      } else if (formData.image) {
        form.append("photos", formData.image);
      }

      const token = localStorage.getItem("token");

      const response = await axios.post(
        "https://communisafe-backend.onrender.com/api/incidents",
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIncidents([response.data.incident, ...incidents]);
      setFormData({
        name: "",
        contactNumber: "",
        date: new Date().toISOString().slice(0, 10),
        type: "",
        location: "",
        description: "",
        image: null,
        latitude: null,
        longitude: null,
      });
      setSelectedImage(null);
      setShowModal(false);

      notify({
        title: "New Incident Reported",
        body: `${response.data.incident.type} at ${response.data.incident.location}`,
        icon: "/favicon.ico",
        url: "/announcements",
      });
    } catch (err) {
      console.error("Error submitting incident:", err);
    }
  };


  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({ ...prev, image: files }));
    setSelectedImage(files.map(file => URL.createObjectURL(file)));
  };

  const handleMarkAsSolved = async (id) => {
    try {
      const res = await axios.put(
        `https://communisafe-backend.onrender.com/api/incidents/${id}`,
        { status: "Solved" }
      );
      setIncidents((prev) =>
        prev.map((inc) =>
          inc._id === id ? { ...inc, status: "Solved" } : inc
        )
      );
    } catch (err) {
      console.error("❌ Failed to update status:", err);
    }
  };

  const filteredIncidents = incidents.filter((incident) =>
    `${incident.type} - ${incident.location}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getStatusColors = (status) => {
    if (status === "Pending") {
      return {
        statusColor: "text-yellow-500",
        borderColor: "border-yellow-400",
      };
    }
    return {
      statusColor: "text-green-600",
      borderColor: "border-green-500",
    };
  };

  // --- Leaflet Map Modal Component ---
  function IncidentMapModal({ open, onClose, incident }) {
    const lat = incident?.latitude;
    const lng = incident?.longitude;

    // State for user's current location
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
      if (open && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          },
          (err) => {
            setUserLocation(null);
          }
        );
      }
    }, [open]);

    return (
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-lg w-[95vw] max-w-2xl p-0 overflow-hidden"
              initial={{ scale: 0.8, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex justify-between items-center px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-green-700 flex items-center gap-2">
                  Incident Location
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 text-xl hover:text-red-500"
                >
                  ×
                </button>
              </div>
              <div style={{ height: 350, width: "100%" }}>
                {(lat && lng) || userLocation ? (
                  <MapContainer
                    center={
                      lat && lng
                        ? [lat, lng]
                        : userLocation
                        ? [userLocation.lat, userLocation.lng]
                        : [14.5995, 120.9842]
                    }
                    zoom={16}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={true}
                    dragging={true}
                    doubleClickZoom={false}
                    zoomControl={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {/* Incident Marker */}
                    {lat && lng && (
                      <Marker position={[lat, lng]}>
                        <Popup>
                          <div>
                            <strong>{incident.type}</strong>
                            <br />
                            {incident.location}
                            <br />
                            {incident.description}
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    {/* User's Current Location Marker */}
                    {userLocation && (
                      <Marker
                        position={[userLocation.lat, userLocation.lng]}
                        icon={L.icon({
                          iconUrl:
                            "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-blue.png",
                          iconSize: [25, 41],
                          iconAnchor: [12, 41],
                          popupAnchor: [1, -34],
                          shadowUrl:
                            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
                          shadowSize: [41, 41],
                        })}
                      >
                        <Popup>
                          <div>
                            <strong>Your Location</strong>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    {/* Draw a line if both are present */}
                    {lat && lng && userLocation && (
                      <Polyline
                        positions={[
                          [userLocation.lat, userLocation.lng],
                          [lat, lng],
                        ]}
                        color="blue"
                      />
                    )}
                  </MapContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No coordinates for this incident.
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t text-sm text-gray-600">
                <div>
                  <span className="font-semibold">Location:</span> {incident.location}
                </div>
                <div>
                  <span className="font-semibold">Date:</span> {incident.date}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // --- Dashboard-style Sidebar ---
  function DashboardSidebar() {
    return (
      <aside className="hidden md:flex flex-col bg-white shadow-lg w-64 min-h-screen px-6 py-8 border-r border-gray-200">
        <div className="flex items-center gap-3 mb-10">
          <img src={multiico} alt="CommuniSafe Logo" className="w-12 h-12" />
          <span className="font-extrabold text-2xl text-green-700 tracking-wide">
            CommuniSafe
          </span>
        </div>
        <nav className="flex flex-col gap-6 text-lg font-semibold">
          <div
            className={`flex items-center gap-3 cursor-pointer transition-all hover:text-green-700 ${
              window.location.pathname === "/dashboard" ? "text-green-700" : "text-gray-700"
            }`}
            onClick={() => navigate("/dashboard")}
          >
            <FaBullhorn size={28} />
            Dashboard
          </div>
          <div
            className={`flex items-center gap-3 cursor-pointer transition-all hover:text-green-700 ${
              window.location.pathname === "/announcements" ? "text-green-700" : "text-gray-700"
            }`}
            onClick={() => navigate("/announcements")}
          >
            <FaBullhorn size={28} />
            Community Announcements
          </div>
          <div
            className={`flex items-center gap-3 cursor-pointer transition-all hover:text-green-700 ${
              window.location.pathname === "/flood-tracker" ? "text-green-700" : "text-gray-700"
            }`}
            onClick={() => navigate("/flood-tracker")}
          >
            <FaWater size={28} />
            Flood Tracker
          </div>
          <div
            className={`flex items-center gap-3 cursor-pointer transition-all hover:text-green-700 ${
              window.location.pathname === "/incidentreport" ? "text-green-700" : "text-gray-700"
            }`}
            onClick={() => navigate("/incidentreport")}
          >
            <FaFileAlt size={28} />
            Incident Report
          </div>
          <div
            className={`flex items-center gap-3 cursor-pointer transition-all hover:text-green-700 ${
              window.location.pathname === "/visitorManagement" ? "text-green-700" : "text-gray-700"
            }`}
            onClick={() => navigate("/visitorManagement")}
          >
            <FaUserFriends size={28} />
            Visitor Management
          </div>
        </nav>
      </aside>
    );
  }


  // --- UI Logic ---
  if (id) {
    if (loading) return <div className="flex justify-center items-center h-96">Loading...</div>;
    if (!incident) return <div className="text-center text-gray-500 mt-10">Incident not found.</div>;
    // ...you can add a detailed incident view here if you want...
    // For now, just show the list below if no id
  }

  const handleCopy = (number) => {
    navigator.clipboard.writeText(number);
    alert("Hotline number copied!");
  };

  return (
    <div className="relative min-h-screen flex bg-gray-50">
      {/* Dashboard-style Sidebar */}
      <DashboardSidebar />
     

      {/* Main */}
      <div className="flex-1 w-full">
        <div className="flex justify-between items-center px-4 py-4 shadow-sm bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden text-gray-600"
            >
              <FiMenu size={25} />
            </button>
            <h1 className="text-2xl font-bold text-green-600">
              Incident Report
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowModal(true)}
              className="bg-gray-200 px-3 py-1 rounded-full flex items-center space-x-2"
            >
              <FiPlus />
              <span>Report Incident</span>
            </button>
            <input
              type="text"
              placeholder="Search"
              className="border rounded-md py-1 px-3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiFilter className="text-xl cursor-pointer" />
          </div>
        </div>

        {/* Report Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg w-[90%] max-w-2xl p-6">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-lg font-semibold text-green-700 flex items-center gap-2">
                  Report Issue
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 text-xl"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="border rounded p-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Contact"
                  value={formData.contactNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactNumber: e.target.value,
                    })
                  }
                  className="border rounded p-2"
                  required
                />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="border rounded p-2"
                  required
                />
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="border rounded p-2"
                  required
                >
                  <option value="">Select Incident Type</option>
                  <option value="Fire"> Fire</option>
                  <option value="Medical"> Medical</option>
                  <option value="Crime"> Crime</option>
                  <option value="Flood">Flood</option>
                  <option value="Other"> Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="border rounded p-2 col-span-2"
                  required
                />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="col-span-2"
                  required
                />
                {selectedImage && (
                  <div className="flex gap-2 mt-2">
                    {selectedImage.map((img, idx) => (
                      <img key={idx} src={img} alt="preview" className="w-16 h-16 object-cover rounded" />
                    ))}
                  </div>
                )}
                <textarea
                  placeholder="Describe the Incident"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  className="border rounded p-2 col-span-2"
                  rows={4}
                  required
                />
              </div>
              <div className="text-center mt-6">
                <button
                  onClick={handleAddIncident}
                  className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
         {previewModal && (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-md w-[90%] max-w-xl">
        <h2 className="text-xl font-bold mb-2">
          {previewModal.type}
        </h2>
        <p className="text-sm mb-2">
          <strong>Location:</strong> {previewModal.location}
        </p>
        <p className="text-sm mb-2">
          <strong>Description:</strong>{" "}
          {previewModal.description}
        </p>
        {/* Show all photos */}
        {previewModal.photos && previewModal.photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {previewModal.photos.map((photo, idx) => (
              <img
                key={idx}
                src={`https://communisafe-backend.onrender.com/api/uploads/${photo}`}
                alt={`Incident Photo ${idx + 1}`}
                className="w-24 h-24 object-cover rounded"
              />
            ))}
          </div>
        )}
        {/* Fallback for old single image */}
        {previewModal.image && !previewModal.photos && (
          <img
            src={`https://communisafe-backend.onrender.com/api/uploads/${previewModal.image}`}
            alt="Incident"
            className="w-full mt-2 rounded-md"
          />
        )}
        <div className="flex gap-2 mt-4 justify-end">
          <button
            className="bg-blue-600 text-white px-4 py-1 rounded-full"
            onClick={() => setMapModalIncident(previewModal)}
          >
            View Map
          </button>
         <button
  className="bg-green-600 text-white px-4 py-1 rounded-full"
  onClick={async () => {
    if (!previewModal || !previewModal._id) {
      alert("Invalid incident ID");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://communisafe-backend.onrender.com/api/incidents/${previewModal._id}/respond`,
        { status: "responding" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIncidents(prev =>
        prev.map(inc =>
          inc._id === previewModal._id
            ? { ...inc, status: "responding" }
            : inc
        )
      );
      setPreviewModal(null);
      alert("You are now responding to this incident!");
    } catch (err) {
      alert("Failed to respond to incident.");
    }
  }}
>
  Respond
</button>
          <button
            className="text-red-600"
            onClick={() => setPreviewModal(null)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}

        {/* Map Modal (Leaflet, animated) */}
        <IncidentMapModal
          open={!!mapModalIncident}
          onClose={() => setMapModalIncident(null)}
          incident={mapModalIncident || {}}
        />

        {/* Incident Cards */}
        <div className="p-6 space-y-6">
  {filteredIncidents.map((incident, index) => {
    const { statusColor, borderColor } = getStatusColors(incident.status);
    const date = new Date(incident.createdAt).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    
     const photoUrl =
      incident.photos && incident.photos.length > 0
        ? `https://communisafe-backend.onrender.com/api/uploads/${incident.photos[0]}`
        : "https://via.placeholder.com/400x200?text=No+Photo";

            return (
               <motion.div
        key={index}
        onClick={() => setPreviewModal(incident)}
        className={`cursor-pointer bg-white rounded-xl shadow-lg border-l-8 ${borderColor} flex flex-col md:flex-row overflow-hidden hover:shadow-2xl transition-all`}
        whileHover={{ scale: 1.01 }}
        layout
        style={{ minHeight: 220 }}
      >
        {/* Photo Preview */}
        <div className="md:w-1/3 w-full h-48 md:h-auto flex-shrink-0 bg-gray-100 flex items-center justify-center">
          <img
            src={photoUrl}
            alt="Incident"
            className="object-cover w-full h-full"
            style={{ minHeight: 180, maxHeight: 240 }}
          />
        </div>
        {/* Details */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1 text-green-700">
              {incident.type} - {incident.location}
            </h2>
            <div className="flex flex-wrap gap-2 items-center text-sm text-gray-500 mt-2">
              <span>{date}</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                incident.status === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : incident.status === "resolved"
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}>
                {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
              </span>
            </div>
            <p className="mt-2 text-gray-700 line-clamp-2">{incident.description}</p>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <button
              className="bg-blue-600 text-white px-4 py-1 rounded-full"
              onClick={e => {
                e.stopPropagation();
                setMapModalIncident(incident);
              }}
            >
              View Map
            </button>
            <button
              className={`bg-green-600 text-white px-4 py-1 rounded-full ${respondingId === incident._id ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={respondingId === incident._id || incident.status === "responding" || incident.status === "resolved"}
              onClick={async e => {
                e.stopPropagation();
                setRespondingId(incident._id);
                try {
                  const token = localStorage.getItem("token");
                  await axios.put(
                    `https://communisafe-backend.onrender.com/api/incidents/${incident._id}/respond`,
                    { status: "responding" },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  setIncidents(prev =>
                    prev.map(inc =>
                      inc._id === incident._id
                        ? { ...inc, status: "responding" }
                        : inc
                    )
                  );
                  setRespondingId(null);
                  alert("You are now responding to this incident!");
                } catch (err) {
                  setRespondingId(null);
                  alert("Failed to respond to incident.");
                }
              }}
            >
              {respondingId === incident._id || incident.status === "responding"
                ? "Responding..."
                : "Respond"}
            </button>
          </div>
        </div>
      </motion.div>
            );
          })}
        </div>
      </div>

      {/* Floating Hotline Button */}
      <div
        onClick={() => setShowEmergencyModal(true)}
        className="fixed bottom-6 right-6 z-50 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg cursor-pointer"
      >
        <FaPhoneAlt className="text-xl" />
      </div>

      {/* Emergency Hotline Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-[90%] max-w-md rounded-lg shadow-xl p-6 relative">
            <button
              onClick={() => setShowEmergencyModal(false)}
              className="absolute top-3 right-4 text-gray-500 text-xl font-bold"
            >
              ×
            </button>
            <h2 className="text-lg font-bold text-center mb-4">
              Emergency Hotline
            </h2>
            <div className="divide-y">
              {HOTLINES.map((hotline, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-3 cursor-pointer hover:bg-green-50 rounded"
                  onClick={() => handleCopy(hotline.number)}
                  title="I-click para kopyahin ang number"
                >
                  <span className="flex items-center gap-2 font-semibold text-green-700">
                    {hotline.icon} {hotline.name}
                  </span>
                  <span className="text-gray-700">{hotline.number}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-3 text-sm text-gray-600">
              <div className="flex items-start gap-2 text-green-700 mb-1">
                <FaLightbulb className="mt-1" /> Kapag may baha, pumunta sa mataas na lugar at iwasan ang paglakad sa baha.
              </div>
              <div className="flex items-start gap-2 text-green-700 mb-1">
                <FaLightbulb className="mt-1" /> Kapag may sunog, huwag gumamit ng elevator at lumabas ng mahinahon.
              </div>
              <div className="flex items-start gap-2 text-green-700">
                <FaLightbulb className="mt-1" /> Laging ihanda ang mga emergency supplies (flashlight, first aid kit, atbp).
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
