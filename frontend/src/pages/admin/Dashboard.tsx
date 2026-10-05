import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBed,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaUsers,
  FaArrowRight,
  FaPlus,
} from 'react-icons/fa';
import { apiClient } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriceTag } from '../../components/ui/PriceTag';
import { Skeleton } from '../../components/feedback/Skeleton';
import './Admin.css';

interface DashboardStats {
  roomsCount: number;
  bookingsToday: number;
  monthlyRevenue: number;
  usersCount: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/bookings?limit=5'),
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
      if (bookingsRes.data?.success) {
        setRecentBookings(bookingsRes.data.data.bookings || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header-row">
        <div>
          <h1 className="admin-page-title">Tổng Quan Hoạt Động</h1>
          <p className="admin-page-subtitle">Thống kê nhanh hiệu suất kinh doanh khách sạn</p>
        </div>

        <Link to="/admin/rooms/add">
          <Button variant="accent" size="md" leftIcon={<FaPlus />}>
            Thêm phòng mới
          </Button>
        </Link>
      </div>

      {/* ── KPI STAT CARDS ── */}
      <div className="kpi-grid">
        <Card padding="md" className="kpi-card">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
            <FaBed />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Tổng số phòng</span>
            <strong className="kpi-value">{isLoading ? <Skeleton width="50px" /> : stats?.roomsCount || 0}</strong>
          </div>
        </Card>

        <Card padding="md" className="kpi-card">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <FaCalendarCheck />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Đơn đặt hôm nay</span>
            <strong className="kpi-value">{isLoading ? <Skeleton width="50px" /> : stats?.bookingsToday || 0}</strong>
          </div>
        </Card>

        <Card padding="md" className="kpi-card">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>
            <FaMoneyBillWave />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Doanh thu tháng này</span>
            <strong className="kpi-value">
              {isLoading ? (
                <Skeleton width="100px" />
              ) : (
                <PriceTag price={stats?.monthlyRevenue || 0} period="" size="md" />
              )}
            </strong>
          </div>
        </Card>

        <Card padding="md" className="kpi-card">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>
            <FaUsers />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Tổng khách hàng</span>
            <strong className="kpi-value">{isLoading ? <Skeleton width="50px" /> : stats?.usersCount || 0}</strong>
          </div>
        </Card>
      </div>

      {/* ── RECENT BOOKINGS TABLE ── */}
      <div style={{ marginTop: '30px' }}>
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
            Đơn Đặt Phòng Gần Đây
          </h2>
          <Link to="/admin/bookings" className="admin-see-all-link">
            Xem tất cả <FaArrowRight size={12} />
          </Link>
        </div>

        <Card padding="none" className="admin-table-card">
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Phòng</th>
                  <th>Ngày đến - đi</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1, 2, 3].map((n) => (
                    <tr key={n}>
                      <td colSpan={6}>
                        <Skeleton height="30px" />
                      </td>
                    </tr>
                  ))
                ) : recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                      Chưa có đơn đặt phòng nào
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                        #{b.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.user?.name || 'Khách'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.user?.email}</div>
                      </td>
                      <td>{b.room?.name}</td>
                      <td>
                        {new Date(b.checkInDate).toLocaleDateString('vi-VN')} →{' '}
                        {new Date(b.checkOutDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td>
                        <PriceTag price={b.totalPrice} period="" size="sm" />
                      </td>
                      <td>
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
