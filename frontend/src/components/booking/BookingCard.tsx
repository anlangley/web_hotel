import React from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaCreditCard } from 'react-icons/fa';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { PriceTag } from '../ui/PriceTag';
import { Button } from '../ui/Button';
import './BookingCard.css';

export interface BookingItem {
  id: string;
  roomId?: string;
  checkInDate: string;
  checkOutDate: string;
  nightCount: number;
  guestsCount: number;
  roomsCount: number;
  totalPrice: number | string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  room: {
    id: string;
    name: string;
    type: string;
    location: string;
    images?: Array<{ url: string }> | string[];
  };
}

interface BookingCardProps {
  booking: BookingItem;
  onCancel?: (bookingId: string) => void;
  onPayNow?: (booking: BookingItem) => void;
  onOpenReview?: (roomId: string) => void;
  className?: string;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onCancel,
  onPayNow,
  onOpenReview,
  className = '',
}) => {
  const checkIn = new Date(booking.checkInDate).toLocaleDateString('vi-VN');
  const checkOut = new Date(booking.checkOutDate).toLocaleDateString('vi-VN');

  const getThumbnail = (): string => {
    if (booking.room.images && booking.room.images.length > 0) {
      const first = booking.room.images[0];
      return typeof first === 'string' ? first : first.url;
    }
    return '/images/room1.jpg';
  };

  const isUnpaid = booking.paymentStatus === 'UNPAID' || booking.status === 'AWAITING_PAYMENT';
  const isCancellable = booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED';
  const isCompleted = booking.status === 'COMPLETED' || booking.status === 'CONFIRMED';

  return (
    <Card className={`booking-card ${className}`} padding="none">
      <div className="booking-card-inner">
        {/* Room Image */}
        <div className="booking-room-img-wrap">
          <img
            src={getThumbnail()}
            alt={booking.room.name}
            className="booking-room-img"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/room1.jpg';
            }}
          />
        </div>

        {/* Details */}
        <div className="booking-card-info">
          <div className="booking-card-header">
            <div>
              <div className="booking-code">Mã đơn: #{booking.id.slice(0, 8).toUpperCase()}</div>
              <h3 className="booking-room-name">
                <Link to={`/rooms/${booking.room?.id || booking.roomId}`}>{booking.room?.name || 'Phòng nghỉ'}</Link>
              </h3>
              <div className="booking-room-location">
                <FaMapMarkerAlt /> {booking.room.location} • {booking.room.type}
              </div>
            </div>

            <div className="booking-statuses">
              <StatusBadge status={booking.status} />
              <StatusBadge status={booking.paymentStatus} />
            </div>
          </div>

          <div className="booking-meta-grid">
            <div className="booking-meta-item">
              <FaCalendarAlt className="booking-meta-icon" />
              <div>
                <div className="meta-label">Nhận phòng - Trả phòng</div>
                <div className="meta-val">{checkIn} → {checkOut} ({booking.nightCount} đêm)</div>
              </div>
            </div>

            <div className="booking-meta-item">
              <FaUsers className="booking-meta-icon" />
              <div>
                <div className="meta-label">Số khách & Phòng</div>
                <div className="meta-val">{booking.guestsCount} khách • {booking.roomsCount} phòng</div>
              </div>
            </div>

            {booking.paymentMethod && (
              <div className="booking-meta-item">
                <FaCreditCard className="booking-meta-icon" />
                <div>
                  <div className="meta-label">Phương thức</div>
                  <div className="meta-val">{booking.paymentMethod}</div>
                </div>
              </div>
            )}
          </div>

          <div className="booking-card-footer">
            <div className="booking-total-wrap">
              <span className="total-label">Tổng thanh toán:</span>
              <PriceTag price={booking.totalPrice} period="" size="md" />
            </div>

            <div className="booking-actions">
              {isUnpaid && onPayNow && (
                <Button variant="accent" size="sm" onClick={() => onPayNow(booking)}>
                  Thanh toán ngay
                </Button>
              )}

              {isCompleted && onOpenReview && (
                <Button variant="outline" size="sm" onClick={() => onOpenReview(booking.room.id)}>
                  Đánh giá phòng
                </Button>
              )}

              {isCancellable && onCancel && (
                <Button variant="danger" size="sm" onClick={() => onCancel(booking.id)}>
                  Hủy đặt phòng
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
