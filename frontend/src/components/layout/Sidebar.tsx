import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  FaChartPie,
  FaBed,
  FaCalendarCheck,
  FaUsers,
  FaTicketAlt,
  FaSignOutAlt,
  FaArrowLeft,
  FaHotel,
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', label: 'Bảng điều khiển', icon: <FaChartPie />, end: true },
    { to: '/admin/rooms', label: 'Quản lý phòng', icon: <FaBed /> },
    { to: '/admin/bookings', label: 'Quản lý đặt phòng', icon: <FaCalendarCheck /> },
    { to: '/admin/users', label: 'Quản lý người dùng', icon: <FaUsers /> },
    { to: '/admin/vouchers', label: 'Mã giảm giá', icon: <FaTicketAlt /> },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <Link to="/" className="admin-logo">
          <div className="admin-logo-icon">
            <FaHotel />
          </div>
          <div>
            <div className="admin-logo-title">LUXSTAY</div>
            <div className="admin-badge-tag">ADMIN PANEL</div>
          </div>
        </Link>
      </div>

      <div className="admin-nav-section">
        <div className="admin-section-label">QUẢN TRỊ VIÊN</div>
        <nav className="admin-nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="admin-item-icon">{item.icon}</span>
              <span className="admin-item-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="admin-sidebar-footer">
        <Link to="/" className="admin-footer-btn back-site-btn">
          <FaArrowLeft /> Xem trang chủ
        </Link>
        <button type="button" className="admin-footer-btn logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Đăng xuất
        </button>
      </div>
    </aside>
  );
};
