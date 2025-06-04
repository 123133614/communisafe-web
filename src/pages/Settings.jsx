// frontend/app/Settings.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiBell, FiUser, FiLock, FiLogOut, FiMoon, FiHelpCircle, FiEdit } from "react-icons/fi";

export default function Settings() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-green-600 font-semibold mb-4"
      >
        <FiArrowLeft />
        Back to Profile
      </button>

      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-md max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-green-600">Settings</h2>

        {/* Account Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Account</h3>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2"><FiUser /> Edit Personal Info</span>
            <button className="text-blue-600 text-sm" onClick={() => navigate("/edit-profile")}>
              Edit
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2"><FiLock /> Change Password</span>
            <button className="text-blue-600 text-sm" onClick={() => navigate("/forgot-password")}>
              Update
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Preferences</h3>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2"><FiBell /> Notifications</span>
            <input
              type="checkbox"
              className="cursor-pointer"
              checked={notificationsEnabled}
              onChange={() => setNotificationsEnabled(!notificationsEnabled)}
            />
          </div>

          
        </div>

        {/* Support */}
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Support</h3>

          <div className="flex items-center gap-2 text-gray-700 cursor-pointer hover:text-green-600" onClick={() => alert("Coming soon!")}>
            <FiHelpCircle />
            Help & FAQs
          </div>

          <div className="flex items-center gap-2 text-gray-700 cursor-pointer hover:text-green-600" onClick={() => alert("Contact: communisafe.app@gmail.com")}>
            <FiEdit />
            Contact Support
          </div>
        </div>

        {/* Logout */}
        <div className="mt-6 pt-4 border-t">
          <div
            className="flex items-center gap-2 text-red-600 cursor-pointer font-semibold"
            onClick={handleLogout}
          >
            <FiLogOut />
            Logout
          </div>
        </div>
      </div>
    </div>
  );
}
