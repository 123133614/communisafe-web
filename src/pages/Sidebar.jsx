import React from 'react';
import { NavLink } from 'react-router-dom';
import multiico from '../images/safe.png';

export default function Sidebar({ active }) {
  return (
    <div style={{
      width: 220, background: '#fff', borderRight: '1px solid #e0e0e0',
      minHeight: '100vh', padding: '32px 0 0 0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40, paddingLeft: 24 }}>
<img src={multiico} alt="Logo" style={{ width: 36, marginRight: 10 }} />
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingLeft: 24 }}>
        <SidebarLink to="/superadmin/dashboard" label="Dashboard" active={active === "Dashboard"} />
        <SidebarLink to="/superadmin/admin-management" label="Admin Management" active={active === "Admin Management"} />
        <SidebarLink to="/superadmin/audit-logs" label="Audit Logs" active={active === "Audit Logs"} />
        <SidebarLink to="/superadmin/reports" label="Reports" active={active === "Reports"} />
        <SidebarLink to="/superadmin/settings" label="System Wide Settings" active={active === "System Wide Settings"} />
      </nav>
    </div>
  );
}



function SidebarLink({ to, label, active }) {
  return (
    <NavLink
      to={to}
      style={{
        color: active ? '#388e3c' : '#444',
        fontWeight: active ? 700 : 500,
        background: active ? '#e8f5e9' : 'none',
        borderRadius: 8,
        padding: '8px 16px',
        textDecoration: 'none'
      }}
    >
      {label}
    </NavLink>
  );
}