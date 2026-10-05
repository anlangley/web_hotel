import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHistory } from 'react-icons/fa';
import { apiClient } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { BookingCard } from '../../components/booking/BookingCard';
import type { BookingItem } from '../../components/booking/BookingCard';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ConfirmModal } from '../../components/feedback/ConfirmModal';
import { ReviewModal } from '../../components/reviews/ReviewModal';
import { Skeleton } from '../../components/feedback/Skeleton';
import './Booking.css';

const STATUS_TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'AWAITING_PAYMENT', label: 'Chờ thanh toán' },
  { id: 'CONFIRMED', label: 'Đã xác nhận' },
  { id: 'COMPLETED', label: 'Đã hoàn thành' },
  { id: 'CANCELLED', label: 'Đã hủy' },
];

export const History: React.FC = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Cancel Modal State
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Review Modal State
  const [reviewRoomId, setReviewRoomId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const url = activeTab === 'ALL' ? '/bookings/my-bookings' : `/bookings/my-bookings?status=${activeTab}`;
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

  const handleConfirmCancel = async () => {
    if (!cancelBookingId) return;
    setIsCancelling(true);
    try {
      const res = await apiClient.put(`/bookings/${cancelBookingId}/cancel`);
      if (res.data?.success) {
        setCancelBookingId(null);
        fetchBookings();
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePayNow = (booking: BookingItem) => {
    navigate(`/booking/payment?bookingId=${booking.id}`);
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!reviewRoomId) return false;
    try {
      const res = await apiClient.post('/reviews', {
        roomId: reviewRoomId,
        rating,
        comment,
      });
      return res.data?.success;
    } catch (err) {
      console.error('Review submit error:', err);
      return false;
    }
  };

  return (
    <div className="container history-page">
      <PageHeader
        title="Lịch Sử Đặt Phòng"
        subtitle="Quản lý các chuyến đi và theo dõi tình trạng đơn đặt phòng của bạn"
        showBack
        backUrl="/"
      />

      {/* Tabs */}
      <div className="history-tabs-bar">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`history-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Booking List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} height="180px" borderRadius="16px" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<FaHistory />}
          title="Chưa có chuyến đi nào"
          description="Bạn chưa có đơn đặt phòng nào trong mục này. Hãy khám phá ngay các phòng nghỉ sang trọng của chúng tôi!"
          actionText="Tìm phòng ngay"
          onAction={() => navigate('/rooms')}
        />
      ) : (
        <div className="history-list">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={(id) => setCancelBookingId(id)}
              onPayNow={handlePayNow}
              onOpenReview={(roomId) => setReviewRoomId(roomId)}
            />
          ))}
        </div>
      )}

      {/* Confirm Cancel Modal */}
      <ConfirmModal
        isOpen={!!cancelBookingId}
        onClose={() => setCancelBookingId(null)}
        onConfirm={handleConfirmCancel}
        title="Xác nhận hủy đặt phòng"
        message="Bạn có chắc chắn muốn hủy đơn đặt phòng này? Thao tác này không thể hoàn tác và phòng sẽ được mở lại cho khách khác."
        confirmText="Hủy đặt phòng"
        isDanger
        isLoading={isCancelling}
      />

      {/* Review Modal */}
      {reviewRoomId && (
        <ReviewModal
          isOpen={!!reviewRoomId}
          onClose={() => setReviewRoomId(null)}
          roomId={reviewRoomId}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
};
