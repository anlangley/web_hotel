import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  FaHotel,
  FaUser,
  FaSignOutAlt,
  FaHistory,
  FaHeart,
  FaShieldAlt,
  FaPhoneAlt,
  FaChevronDown,
  FaCrown,
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { normalizeImageUrl } from '../../utils/image';
import './Header.css';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  return (
    <header className={`site-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container header-container">
        {/* Luxury Logo */}
        <Link to="/" className="site-logo">
          <div className="logo-crest">
            <FaCrown className="crown-icon" />
            <FaHotel className="hotel-icon" />
          </div>
          <div className="logo-text">
            <span className="logo-title">LUXSTAY</span>
            <span className="logo-subtitle">HOTEL & RESORT • 5-STAR</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="header-nav">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
            <span>Trang chủ</span>
          </NavLink>
          <NavLink to="/rooms" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>Phòng nghỉ</span>
          </NavLink>
          <NavLink to="/rooms?deal=true" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>Ưu đãi đặc quyền</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>Tra cứu đặt phòng</span>
          </NavLink>
          {user?.role === 'ADMIN' && (
            <NavLink to="/admin" className="nav-link admin-nav-link">
              <FaShieldAlt /> <span>Quản trị</span>
            </NavLink>
          )}
        </nav>

        {/* Header Right Actions */}
        <div className="header-actions">
          {/* Concierge Hotline */}
          <a href="tel:19006868" className="header-hotline" title="Hotline hỗ trợ 24/7">
            <div className="hotline-icon">
              <FaPhoneAlt />
            </div>
            <div className="hotline-info">
              <span className="hotline-label">Hỗ trợ 24/7</span>
              <span className="hotline-number">1900 6868</span>
            </div>
          </a>

          {user ? (
            <div className="user-menu-container">
              <button
                className={`user-profile-button ${dropdownOpen ? 'open' : ''}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="Tài khoản cá nhân"
              >
                <div className="user-avatar-circle">
                  {user.avatarUrl ? (
                    <img src={normalizeImageUrl(user.avatarUrl)} alt={user.name || 'User'} className="avatar-img" />
                  ) : (
                    <span>{(user.name || user.email || 'U')[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="user-profile-details">
                  <span className="user-name-text">{user.name || user.email.split('@')[0]}</span>
                  <span className="user-tier-tag">{user.role === 'ADMIN' ? 'Quản Trị Viên' : 'Hội Viên Vàng'}</span>
                </div>
                <FaChevronDown className={`chevron-icon ${dropdownOpen ? 'rotate' : ''}`} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setDropdownOpen(false)} />
                  <div className="user-dropdown-menu" onClick={() => setDropdownOpen(false)}>
                    <div className="dropdown-user-header">
                      <div className="dropdown-user-avatar">
                        {user.avatarUrl ? (
                          <img src={normalizeImageUrl(user.avatarUrl)} alt={user.name || 'User'} />
                        ) : (
                          <span>{(user.name || user.email || 'U')[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="dropdown-user-meta">
                        <p className="dropdown-user-name">{user.name || 'Khách hàng'}</p>
                        <p className="dropdown-user-email">{user.email}</p>
                        <span className="dropdown-role-badge">
                          {user.role === 'ADMIN' ? 'ADMINISTRATOR' : 'PREMIUM MEMBER'}
                        </span>
                      </div>
                    </div>

                    <div className="dropdown-divider" />

                    <Link to="/profile" className="dropdown-item">
                      <FaUser className="item-icon" /> Hồ sơ cá nhân
                    </Link>
                    <Link to="/history" className="dropdown-item">
                      <FaHistory className="item-icon" /> Lịch sử đặt phòng
                    </Link>
                    <Link to="/profile/favorites" className="dropdown-item">
                      <FaHeart className="item-icon" /> Danh sách yêu thích
                    </Link>

                    {user.role === 'ADMIN' && (
                      <Link to="/admin" className="dropdown-item admin-item">
                        <FaShieldAlt className="item-icon" /> Bảng điều khiển Quản trị
                      </Link>
                    )}

                    <div className="dropdown-divider" />

                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                      <FaSignOutAlt className="item-icon" /> Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Đăng nhập
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="accent" size="sm">
                  Đăng ký ngay
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
