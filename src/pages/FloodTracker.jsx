import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import axios from "axios";
import { FaBullhorn, FaWater, FaFileAlt, FaUserFriends } from "react-icons/fa";

import useDesktopNotification from "../hooks/useDesktopNotification";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  });
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    return data.display_name || "Unknown location";
  } catch (error) {
    console.error("❌ Reverse geocoding failed:", error);
    return "Unknown location";
  }
}

function DashboardSidebar() {
    const navigate = useNavigate();
  return (
    <aside className="hidden md:flex flex-col bg-white shadow-lg w-64 min-h-screen px-6 py-8 border-r border-gray-200">
      <div className="flex items-center gap-3 mb-10">
        <img src={require("../images/multiico.png")} alt="CommuniSafe Logo" className="w-12 h-12" />
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

function LocationMarker({ setNewAlert, setShowModal, sensor }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const localISOTime = new Date(now.getTime() - offset * 60000).toISOString();
      const locationName = await reverseGeocode(lat, lng);
      

      // Compute severity based on sensor water level
      let severity = "";
      if (sensor && sensor.waterLevel) {
        const waterLevelFt = sensor.waterLevel / 30.48;
        if (waterLevelFt >= 2.9) severity = "High";
        else if (waterLevelFt >= 2) severity = "Medium";
        else if (waterLevelFt >= 1) severity = "Low";
        else severity = "Low";
      }

      setNewAlert((prev) => ({
        ...prev,
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        location: locationName,
        timestamp: localISOTime,
        severity, // auto-set severity
      }));
      setShowModal(true);
    },
  });
  return null;
}

export default function FloodTracker() {
  const notify = useDesktopNotification();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  
  const [newAlert, setNewAlert] = useState({
    location: "",
    severity: "",
    description: "",
    contact:"",
    timestamp: "",
    lat: "",
    lng: "",
  });

  const [sensor, setSensor] = useState(null);

  
  const center = [14.479859, 121.009229]; 

  const role = localStorage.getItem("role") || "";
  const canReport = role === "security" || role === "official";
  const token = localStorage.getItem("token");

  // Fetch sensor data and alerts
  useEffect(() => {
    axios
      .get("https://communisafe-backend.onrender.com/api/flood/sensors", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => {
        if (res.data && res.data.length > 0) setSensor(res.data[0]);
      })
      .catch((err) => console.error("Error fetching sensor:", err));

    axios
      .get("https://communisafe-backend.onrender.com/api/flood/reports")
      .then((res) => setAlerts(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      axios
        .get("https://communisafe-backend.onrender.com/api/flood/sensors", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        .then((res) => {
          if (res.data && res.data.length > 0) setSensor(res.data[0]);
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // --- Handle flood report submission ---
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    const latNum = parseFloat(newAlert.lat);
    const lngNum = parseFloat(newAlert.lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      alert("Latitude and Longitude must be valid numbers.");
      return;
    }

    try {
      const payload = { ...newAlert, lat: latNum, lng: lngNum, contact: newAlert.contact };
      await axios.post(
        "https://communisafe-backend.onrender.com/api/flood/reports",
        payload,
        token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : undefined
      );

      notify({
        title: "New Flood Alert",
        body: `${payload.location} (${payload.severity})`,
        icon: "/favicon.ico",
        url: "/announcements",
      });

      setShowModal(false);
      setNewAlert({
        location: "",
        severity: "",
        description: "",
        timestamp: "",
        lat: "",
        lng: "",
      });

      const res = await axios.get("https://communisafe-backend.onrender.com/api/flood/reports");
      setAlerts(res.data);
    } catch (err) {
      console.error("❌ Failed to submit flood report:", err);
      alert("❌ Failed to submit flood report. Please make sure you are logged in.");
    }
  };

  const getSeverityColor = (severity) => {
    if (severity === "HIGH") return "red";
    if (severity === "MEDIUM") return "orange";
    return "blue";
  };

  // --- Compute water level in feet ---
  const waterLevelFt = sensor && sensor.waterLevel
    ? (sensor.waterLevel / 30.48)
    : 0;

  // --- Compute flood level ---
  let floodLevel = "NONE";
  if (waterLevelFt >= 2.9) floodLevel = "HIGH";
  else if (waterLevelFt >= 2) floodLevel = "MEDIUM";
  else if (waterLevelFt >= 1) floodLevel = "LOW";

  return (
    <div className="relative min-h-screen flex bg-gray-50">
      <DashboardSidebar />
      



      {/* Main */}
<main className="flex-1 p-4 md:p-8 flex flex-col lg:flex-row gap-8 z-0 bg-gradient-to-br from-gray-50 to-green-50">
       
        <div className="flex-1 flex flex-col gap-6">
          <section>
    <h2 className="text-lg font-bold text-gray-700 mb-2">Flood Map</h2>
    <div className="rounded-2xl overflow-hidden shadow-lg border border-green-100 bg-white" style={{ height: "340px", width: "100%" }}>
              <MapContainer
                center={center}
                zoom={17}
                style={{ height: "100%", width: "100%" }}
                maxZoom={19}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors, OpenStreetMap DE"
                />
                {canReport && (
                  <LocationMarker
                    setNewAlert={setNewAlert}
                    setShowModal={setShowModal}
                    sensor={sensor}
                  />
                )}
                {alerts.map((alert, i) => {
                  const iconColor = getSeverityColor(alert.severity);
                  const customIcon = new L.Icon({
                    iconUrl: `https://maps.google.com/mapfiles/ms/icons/${iconColor}-dot.png`,
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowUrl: markerShadow,
                    shadowSize: [41, 41],
                  });
                  return (
                    <Marker
                      key={i}
                      position={[
                        parseFloat(alert.lat),
                        parseFloat(alert.lng),
                      ]}
                      icon={customIcon}
                    >
                      <Popup>
                        <strong>{alert.location}</strong>
                        <br />
                        {alert.description}
                        <br />
                        <span style={{ color: getSeverityColor(alert.severity), fontWeight: "bold" }}>
                          Severity: {alert.severity}
                        </span>
                        <br />
                        {formatTimestamp(alert.timestamp)}
                      </Popup>
                    </Marker>
                  );
                })}
                {sensor && sensor.coordinates && (
                  <Marker
                    position={[
                     14.479859, // sensor.coordinates.lat,
                      121.009229 // sensor.coordinates.lng,
                    ]}
                    icon={
                      new L.Icon({
                        iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowUrl: markerShadow,
                        shadowSize: [41, 41],
                      })
                    }
                  >
                    <Popup>
                      <strong>{sensor.name}</strong>
                      <br />
                      {sensor.address}
                      <br />
                      Water Level: {sensor.waterLevel} cm / {waterLevelFt.toFixed(2)} ft
                      <br />
                      Flood Level: {floodLevel}
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
            {/* Legend */}
            <div className="flex gap-4 mt-2 text-sm">
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-green-600" /> Sensor
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-600" /> Low
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-orange-400" /> Medium
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-red-600" /> High
              </div>
            </div>
          </section>

          {/* Sensor Data Card */}
          <section>
            <h3 className="font-semibold text-gray-700 mb-2">Sensor Real-Time Data</h3>
            <div className="bg-white border rounded-lg shadow p-4">
              {sensor ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <span><strong>Location:</strong> {sensor.address}</span>
                  <span><strong>Water Level:</strong> {sensor.waterLevel} cm / {waterLevelFt.toFixed(2)} ft</span>
                  <span><strong>Battery:</strong> {sensor.batteryLevel}%</span>
                  <span><strong>Signal:</strong> {sensor.signalStrength}</span>
                  <span><strong>Status:</strong> {sensor.status}</span>
                  <span><strong>Last Updated:</strong> {sensor.lastUpdated ? formatTimestamp(sensor.lastUpdated) : "N/A"}</span>
                  <span>
                    <strong>Flood Level:</strong>{" "}
                    <span
                      style={{
                        color:
                          floodLevel === "HIGH"
                            ? "red"
                            : floodLevel === "MEDIUM"
                            ? "orange"
                            : floodLevel === "LOW"
                            ? "blue"
                            : "gray",
                        fontWeight: "bold",
                      }}
                    >
                      {floodLevel}
                    </span>
                  </span>
                </div>
              ) : (
                <span className="text-gray-500">No sensor data available.</span>
              )}
            </div>
          </section>
        </div>

        {/* Right: Alerts & Actions */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6">
          {/* Recent Alerts */}
          <section>
            <h3 className="font-semibold text-gray-700 mb-2">Recent Flood Alerts</h3>
            <div className="bg-white border rounded-lg shadow p-4 max-h-[340px] overflow-y-auto">
              {alerts.length === 0 && (
                <span className="text-gray-500">No recent alerts.</span>
              )}
              {alerts.slice(0, 5).map((alert, i) => (
                <div
                  key={i}
                  className="mb-3 p-2 rounded border-l-4"
                  style={{
                    borderColor: getSeverityColor(alert.severity),
                    background: "#f9fafb",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: getSeverityColor(alert.severity) }}
                    />
                    <span className="font-bold">{alert.severity}</span>
                    <span className="text-xs text-gray-400 ml-auto">{formatTimestamp(alert.timestamp)}</span>
                  </div>
                  <div className="font-semibold">{alert.location}</div>
                  <div className="text-gray-600 text-sm">{alert.description}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Emergency Contacts */}
          <section>
            <h3 className="font-semibold text-gray-700 mb-2">Emergency Contacts</h3>
            <div className="bg-white border rounded-lg shadow p-4 flex flex-col gap-2">
              <a
                href="tel:0998-598-7926"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
              >
                Barangay Moonwalk: 0998-598-7926
              </a>
              <a
                href="tel:8826-9131"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
              >
                Parañaque BFP: 8826-9131
              </a>
            </div>
          </section>

          
          {canReport && (
            <button
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow transition"
              onClick={() => setShowModal(true)}
            >
              + Report Flood
            </button>
          )}
        </div>
      </main>

     
      {showModal && canReport && (
       <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
  <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-green-600">
            <h2 className="text-xl font-bold mb-4 text-center text-green-700">
              Report Flood
            </h2>
            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={newAlert.location}
                  readOnly
                  className="w-full border p-2 rounded bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Severity</label>
                <div
                  className="w-full border p-2 rounded bg-gray-100 font-bold text-center"
                  style={{ color: getSeverityColor(newAlert.severity) }}
                >
                  {newAlert.severity || "N/A"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  placeholder="Describe the flood situation"
                  value={newAlert.description}
                  onChange={(e) =>
                    setNewAlert({ ...newAlert, description: e.target.value })
                  }
                  required
                  className="w-full border p-2 rounded"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Latitude</label>
                  <input
                    type="text"
                    value={newAlert.lat}
                    disabled
                    className="w-full border p-2 rounded bg-gray-100"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Longitude</label>
                  <input
                    type="text"
                    value={newAlert.lng}
                    disabled
                    className="w-full border p-2 rounded bg-gray-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={newAlert.timestamp.slice(0, 16)}
                  disabled
                  className="w-full border p-2 rounded bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Number</label>
                <input
                  type="text"
                  placeholder="Your contact number"
                  value={newAlert.contact}
                  onChange={e => setNewAlert({ ...newAlert, contact: e.target.value })}
                  required
                  className="w-full border p-2 rounded"
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}