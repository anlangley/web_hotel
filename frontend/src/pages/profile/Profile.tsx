import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaUserEdit,
  FaLock,
  FaHeart,
  FaBell,
  FaCreditCard,
  FaQuestionCircle,
  FaInfoCircle,
  FaSignOutAlt,
  FaChevronRight,
  FaShieldAlt,
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { normalizeImageUrl } from '../../utils/image';
import './Profile.css';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuSections = [
    {
      title: 'Tài khoản & Bảo mật',
      items: [
        { to: '/profile/edit', icon: <FaUserEdit />, label: 'Chỉnh sửa thông tin cá nhân' },
        { to: '/change-password', icon: <FaLock />, label: 'Đổi mật khẩu' },
        { to: '/profile/favorites', icon: <FaHeart color="#EF4444" />, label: 'Danh sách phòng yêu thích' },
      ],
    },
    {
      title: 'Tùy chọn & Tiện ích',
      items: [
        { to: '/profile/notifications', icon: <FaBell color="#3B82F6" />, label: 'Trung tâm thông báo' },
        { to: '/profile/payment-methods', icon: <FaCreditCard color="#10B981" />, label: 'Phương thức thanh toán' },
      ],
    },
    {
      title: 'Thông tin & Hỗ trợ',
      items: [
        { to: '/profile/help', icon: <FaQuestionCircle />, label: 'Trợ giúp & Câu hỏi thường gặp' },
        { to: '/profile/about', icon: <FaInfoCircle />, label: 'Về chúng tôi & Điều khoản' },
      ],
    },
  ];

  return (
    <div className="container profile-page" style={{ maxWidth: '780px' }}>
      <PageHeader title="Hồ Sơ Của Tôi" subtitle="Quản lý tài khoản và cài đặt cá nhân" />

      {/* User Info Header Card */}
      <Card padding="lg" className="profile-hero-card">
        <div className="profile-hero-inner">
          <div className="profile-avatar-large">
            {user?.avatarUrl ? (
              <img src={normalizeImageUrl(user.avatarUrl)} alt={user.name || 'User'} />
            ) : (
              <span>{(user?.name || user?.email || 'U')[0].toUpperCase()}</span>
            )}
          </div>
          <div className="profile-user-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="profile-name">{user?.name || 'Khách hàng'}</h2>
              {user?.role === 'ADMIN' && (
                <span className="profile-admin-badge">
                  <FaShieldAlt /> ADMIN
                </span>
              )}
            </div>
            <p className="profile-email">{user?.email}</p>
            {user?.phone && <p className="profile-phone">SĐT: {user.phone}</p>}
          </div>

          <Link to="/profile/edit" className="profile-edit-btn">
            Chỉnh sửa
          </Link>
        </div>
      </Card>

      {/* Menu Sections */}
      <div className="profile-menus-list">
        {menuSections.map((sec, idx) => (
          <div key={idx} className="menu-section-block">
            <h4 className="menu-section-header">{sec.title}</h4>
            <Card padding="none" className="menu-group-card">
              {sec.items.map((item, itemIdx) => (
                <Link key={itemIdx} to={item.to} className="profile-menu-row">
                  <div className="menu-row-left">
                    <span className="menu-row-icon">{item.icon}</span>
                    <span className="menu-row-label">{item.label}</span>
                  </div>
                  <FaChevronRight className="menu-row-chevron" />
                </Link>
              ))}
            </Card>
          </div>
        ))}

        {/* Logout Row */}
        <div className="menu-section-block">
          <Card padding="none" className="menu-group-card">
            <button type="button" className="profile-menu-row logout-row" onClick={handleLogout}>
              <div className="menu-row-left">
                <span className="menu-row-icon"><FaSignOutAlt /></span>
                <span className="menu-row-label">Đăng xuất khỏi tài khoản</span>
              </div>
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};
