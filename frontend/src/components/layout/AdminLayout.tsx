import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../hooks/useAuth';

export const AdminLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F1F5F9' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Admin Top Navbar */}
        <header
          style={{
            height: '64px',
            backgroundColor: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--spacing-xl)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            Hệ thống Quản trị Khách sạn
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Xin chào, <strong>{user?.name || user?.email}</strong>
            </span>
            <Link
              to="/profile"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-round)',
                backgroundColor: 'var(--primary)',
                color: 'var(--text-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              {(user?.name || user?.email || 'A')[0].toUpperCase()}
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main style={{ flex: 1, padding: 'var(--spacing-xl)', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
