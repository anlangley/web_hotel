import React, { useEffect, useState } from 'react';
import { FaCalendarCheck, FaSearch } from 'react-icons/fa';
import { apiClient } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriceTag } from '../../components/ui/PriceTag';
import { Skeleton } from '../../components/feedback/Skeleton';
import './Admin.css';

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'AWAITING_PAYMENT', label: 'Chờ thanh toán' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'COMPLETED', label: 'Đã hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

export const AdminBookings: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const url = statusFilter ? `/bookings?status=${statusFilter}` : '/bookings';
      const res = await apiClient.get(url);
      if (res.data?.success) {
        setBookings(res.data.data.bookings || []);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingId(bookingId);
    try {
      const res = await apiClient.put(`/bookings/${bookingId}/status`, {
        status: newStatus,
      });
      if (res.data?.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
        );
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = bookings.filter((b) => {
    const code = b.id.toLowerCase();
    const guest = (b.user?.name || '').toLowerCase();
    const email = (b.user?.email || '').toLowerCase();
    const room = (b.room?.name || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    return code.includes(q) || guest.includes(q) || email.includes(q) || room.includes(q);
  });

  return (
    <div className="admin-page">
      <div className="admin-header-row">
        <div>
          <h1 className="admin-page-title">Quản Lý Đặt Phòng</h1>
          <p className="admin-page-subtitle">Theo dõi và cập nhật trạng thái đơn đặt phòng của khách hàng</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <FaSearch className="admin-search-icon" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên khách, email, tên phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-select"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <Card padding="none" className="admin-table-card">
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Phòng</th>
                <th>Thời gian</th>
                <th>Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Cập nhật nhanh</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4].map((n) => (
                  <tr key={n}>
                    <td colSpan={8}>
                      <Skeleton height="36px" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <FaCalendarCheck size={32} style={{ color: 'var(--text-light)', marginBottom: '8px' }} />
                    <p>Không có đơn đặt phòng nào</p>
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                      #{b.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.user?.name || 'Khách'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {b.user?.email} {b.user?.phone ? `• ${b.user.phone}` : ''}
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{b.room?.name}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        {new Date(b.checkInDate).toLocaleDateString('vi-VN')} →{' '}
                        {new Date(b.checkOutDate).toLocaleDateString('vi-VN')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {b.nightCount} đêm • {b.guestsCount} khách
                      </div>
                    </td>
                    <td>
                      <PriceTag price={b.totalPrice} period="" size="sm" />
                    </td>
                    <td>
                      <StatusBadge status={b.paymentStatus || 'UNPAID'} />
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td>
                      <select
                        value={b.status}
                        disabled={updatingId === b.id}
                        onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                        className="admin-status-dropdown"
                      >
                        <option value="AWAITING_PAYMENT">Chờ thanh toán</option>
                        <option value="CONFIRMED">Xác nhận đơn</option>
                        <option value="COMPLETED">Đã hoàn thành</option>
                        <option value="CANCELLED">Hủy đơn</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
