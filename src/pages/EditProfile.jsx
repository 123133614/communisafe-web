// EditProfile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

export default function EditProfile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    contactNumber: "",
    address: "",
  });

  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    setFormData({
      name: localStorage.getItem("name") || "",
      contactNumber: localStorage.getItem("contactNumber") || "",
      address: localStorage.getItem("address") || "",
    });
    setProfileImage(localStorage.getItem("profileImage") || "");
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    localStorage.setItem("name", formData.name);
    localStorage.setItem("contactNumber", formData.contactNumber);
    localStorage.setItem("address", formData.address);
    localStorage.setItem("profileImage", profileImage);

    alert("Profile updated!");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-green-600 font-semibold mb-4"
      >
        <FiArrowLeft />
        Back to Settings
      </button>

      <div className="bg-white dark:bg-gray-800 text-black dark:text-white p-6 rounded-xl shadow-md max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-green-600 dark:text-green-400">Edit Personal Info</h2>

        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full border-4 border-green-400 overflow-hidden">
            <img
              src={profileImage || "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <input type="file" accept="image/*" onChange={handleImageChange} className="mt-2" />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block font-medium">Full Name</label>
            <input
              type="text"
              name="name"
              className="w-full p-2 border rounded-md mt-1 dark:bg-gray-700"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block font-medium">Contact Number</label>
            <input
              type="text"
              name="contactNumber"
              className="w-full p-2 border rounded-md mt-1 dark:bg-gray-700"
              value={formData.contactNumber}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block font-medium">Home Address</label>
            <input
              type="text"
              name="address"
              className="w-full p-2 border rounded-md mt-1 dark:bg-gray-700"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          <button
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg mt-4"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
