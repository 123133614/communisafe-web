import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import { FiSearch, FiUserPlus, FiFilter } from "react-icons/fi";

export default function AdminManagement() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("official");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPendingUsers(roleFilter);
    // eslint-disable-next-line
  }, [roleFilter]);

  const fetchPendingUsers = async (role) => {
    setLoading(true);
    try {
      // Gamitin ang dynamic roleFilter, hindi laging 'official'
      const res = await axios.get(
        `https://communisafe-backend.onrender.com/api/auth/pending-users?role=${role}`
      );
      setUsers(res.data);
    } catch (err) {
      setUsers([]);
    }
    setLoading(false);
  };

  const updateUserStatus = async (userId, status) => {
    setLoading(true);
    try {
      await axios.put(
  `https://communisafe-backend.onrender.com/api/auth/user-status/${userId}`,
  { status, role: roleFilter }
);
      fetchPendingUsers(roleFilter);
    } catch (err) {
      alert("Failed to update user status.");
    }
    setLoading(false);
  };

  // Filter users by search
  const filteredUsers = users.filter(
    user =>
      (user.username || user.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafb" }}>
      <Sidebar active="Admin Management" />
      <div style={{ flex: 1, padding: "0 0 0 0", background: "#f8fafb" }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "32px 48px 0 48px"
        }}>
          <div>
            <h1 style={{
              fontSize: 32, fontWeight: 700, color: "#4caf50", margin: 0, letterSpacing: 1
            }}>
              Super Admin Panel
            </h1>
            <div style={{
              fontSize: 24, fontWeight: 700, color: "#388e3c", marginTop: 8
            }}>
              Admin Management
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{
              display: "flex", alignItems: "center", background: "#fff",
              borderRadius: 8, padding: "6px 16px", boxShadow: "0 1px 4px #0001"
            }}>
              <FiSearch style={{ fontSize: 20, color: "#888" }} />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  border: "none", outline: "none", marginLeft: 8, fontSize: 16, background: "none"
                }}
              />
            </div>
            <button style={{
              display: "flex", alignItems: "center", background: "#4caf50",
              color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px",
              fontWeight: 600, fontSize: 16, cursor: "pointer"
            }}>
              <FiUserPlus style={{ marginRight: 8 }} /> Add new User
            </button>
          </div>
        </div>

        {/* Filter */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          padding: "16px 48px 0 48px"
        }}>
          <div style={{
            display: "flex", alignItems: "center", background: "#fff",
            borderRadius: 8, padding: "6px 16px", boxShadow: "0 1px 4px #0001"
          }}>
            <FiFilter style={{ fontSize: 20, color: "#888" }} />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              style={{
                border: "none", outline: "none", marginLeft: 8, fontSize: 16, background: "none"
              }}
            >
              <option value="official">Community Officials</option>
              <option value="security">Security Personnel</option>
            </select>
          </div>
        </div>

        {/* User List Table */}
        <div style={{
          margin: "32px 48px", background: "#fff", borderRadius: 18,
          boxShadow: "0 2px 12px #0001", padding: 32
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 18
          }}>
            <div style={{ fontWeight: 700, fontSize: 22, color: "#444" }}>User Lists</div>
            {/* Add new user button can go here if needed */}
          </div>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center" }}>Loading...</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#e8f5e9" }}>
                  <th style={thStyle}>Username</th>
                  <th style={thStyle}>Email Address</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>ID Image</th> {/* NEW COLUMN */}
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#aaa" }}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user._id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={tdStyle}>{user.username || user.name}</td>
                      <td style={tdStyle}>{user.email}</td>
                      <td style={tdStyle}>{user.role}</td>
                      {/* ID IMAGE COLUMN */}
                      <td style={tdStyle}>
                        {user.filePath ? (
                          <a
                            href={`/api/uploads/${user.filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "inline-block" }}
                          >
                            <img
                              src={`/api/uploads/${user.filePath}`}
                              alt="ID"
                              style={{
                                width: 48,
                                height: 48,
                                objectFit: "cover",
                                borderRadius: 6,
                                border: "1px solid #ccc",
                                boxShadow: "0 2px 8px #0001",
                                cursor: "pointer"
                              }}
                            />
                          </a>
                        ) : (
                          <span style={{ color: "#aaa" }}>No ID</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          color: user.status === "active" ? "#388e3c" :
                            user.status === "pending" ? "#f39c12" : "#e74c3c",
                          fontWeight: 600
                        }}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {user.status === "pending" ? (
                          <>
                            <button
                              style={approveBtn}
                              onClick={() => updateUserStatus(user._id, "active")}
                            >
                              Approve
                            </button>
                            <button
                              style={rejectBtn}
                              onClick={() => updateUserStatus(user._id, "rejected")}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span style={{ color: "#bbb" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: "14px 10px",
  fontWeight: 700,
  fontSize: 16,
  color: "#388e3c",
  borderBottom: "2px solid #c8e6c9",
  textAlign: "left"
};
const tdStyle = {
  padding: "12px 10px",
  fontSize: 15,
  color: "#444",
  borderBottom: "1px solid #eee"
};
const approveBtn = {
  background: "#4caf50",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "6px 16px",
  marginRight: 8,
  fontWeight: 600,
  cursor: "pointer"
};
const rejectBtn = {
  background: "#e74c3c",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "6px 16px",
  fontWeight: 600,
  cursor: "pointer"
};
