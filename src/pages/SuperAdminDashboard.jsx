import React from 'react';
import Sidebar from './Sidebar';
import multiico from '../images/multiico.png'; // adjust path if needed
import { useNavigate } from "react-router-dom";

export default function SuperAdminDashboard() {

    const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafb' }}>
      <Sidebar active="Dashboard" />
      <div style={{ flex: 1, padding: '40px 60px', position: 'relative' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
          <img src={multiico} alt="Logo" style={{ width: 48, marginRight: 18 }} />
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#3a3a3a', margin: 0 }}>
            Welcome, Admin!
          </h1>
          <div style={{ flex: 1 }} />
          {/* Notification bell and profile icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', top: -6, right: -6, background: '#e74c3c',
                color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>1</span>
              <svg width="28" height="28" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"/>
              </svg>
            </div>
            <svg width="32" height="32" fill="none" stroke="#4caf50" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1" />
            </svg>
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', gap: 32, marginTop: 40 }}>
          <div
  className="dashboard-card active"
  style={cardStyle(true)}
  onClick={() => navigate('/superadmin/admin-management')}
>
  <div style={{ fontSize: 40, marginBottom: 10 }}>👤⚙️</div>
  <div>Admin Management</div>
          </div>

          
          <div className="dashboard-card" style={cardStyle(false)}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
            <div>Audit Logs</div>
          </div>
          <div className="dashboard-card" style={cardStyle(false)}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📝</div>
            <div>Reports</div>
          </div>
          <div className="dashboard-card" style={cardStyle(false)}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>⚙️</div>
            <div>System Wide Settings</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Card style helper
function cardStyle(active) {
  return {
    background: active ? '#e8f5e9' : '#fff',
    border: active ? '2px solid #4caf50' : '1px solid #e0e0e0',
    borderRadius: 16,
    boxShadow: active ? '0 4px 16px #4caf5022' : '0 2px 8px #0001',
    padding: '32px 36px',
    minWidth: 180,
    minHeight: 160,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontWeight: 600,
    fontSize: 18,
    color: active ? '#388e3c' : '#444',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };
}