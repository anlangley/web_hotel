import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaUsers, FaTicketAlt, FaShieldAlt, FaMapMarkerAlt, FaCheck } from 'react-icons/fa';
import { apiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { PriceBreakdown } from '../../components/booking/PriceBreakdown';
import { Skeleton } from '../../components/feedback/Skeleton';
import './Booking.css';

export const Booking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const roomId = searchParams.get('roomId');
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  const guestsParam = searchParams.get('guests');

  const [room, setRoom] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Booking fields
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(checkInParam || formatDate(tomorrow));
  const [endDate, setEndDate] = useState(checkOutParam || formatDate(dayAfter));
  const [guests, setGuests] = useState(Number(guestsParam) || 2);
  const [roomsCount, setRoomsCount] = useState(1);
  const [specialRequest, setSpecialRequest] = useState('');

  // Contact Info
  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');

  // Voucher
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

  useEffect(() => {
    if (!roomId) {
      navigate('/rooms');
      return;
    }
    fetchRoom();
  }, [roomId]);

  const fetchRoom = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get(`/rooms/${roomId}`);
      if (res.data?.success) {
        setRoom(res.data.data.room);
      }
    } catch (err) {
      console.error('Error fetching room:', err);
      setErrorMsg('Không thể tải thông tin phòng.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateNights = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    return Math.max(1, Math.round(diff));
  };

  const nights = calculateNights();
  const pricePerNight = Number(room?.pricePerNight) || 0;
  const subtotal = pricePerNight * nights * roomsCount;
  const discountAmount = appliedVoucher ? subtotal * appliedVoucher.discount : 0;

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) return;
    setIsCheckingVoucher(true);
    setVoucherError('');
    try {
      const res = await apiClient.post('/vouchers/apply', {
        code: voucherCodeInput.trim().toUpperCase(),
        checkInDate: startDate,
        checkOutDate: endDate,
      });
      if (res.data?.success) {
        setAppliedVoucher({
          code: res.data.data.code,
          discount: Number(res.data.data.discount),
        });
      } else {
        setVoucherError(res.data?.message || 'Mã giảm giá không hợp lệ.');
      }
    } catch (err: any) {
      setVoucherError(err?.response?.data?.message || 'Không thể kiểm tra mã giảm giá.');
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestEmail || !guestPhone) {
      setErrorMsg('Vui lòng điền đầy đủ họ tên, email và số điện thoại liên hệ.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        roomId,
        checkInDate: startDate,
        checkOutDate: endDate,
        nightCount: nights,
        guestsCount: guests,
        roomsCount,
        specialRequest,
        voucherCode: appliedVoucher?.code || undefined,
        discountAmount: discountAmount || undefined,
      };

      const res = await apiClient.post('/bookings', payload);
      if (res.data?.success) {
        const createdBooking = res.data.data.booking;
        navigate(`/booking/payment?bookingId=${createdBooking.id}`);
      } else {
        setErrorMsg(res.data.message || 'Đặt phòng không thành công.');
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn đặt phòng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '60px 0' }}>
        <Skeleton height="50px" width="350px" />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginTop: '30px' }}>
          <Skeleton height="400px" borderRadius="18px" />
          <Skeleton height="350px" borderRadius="18px" />
        </div>
      </div>
    );
  }

  const thumbnail =
    room?.images && room?.images.length > 0
      ? typeof room.images[0] === 'string'
        ? room.images[0]
        : room.images[0].url
      : '/images/room1.jpg';

  return (
    <div className="container booking-page">
      {/* ── STEPPER HEADER ── */}
      <div className="booking-stepper">
        <div className="step-item active">
          <div className="step-circle">1</div>
          <span className="step-title">1. Thông Tin Đặt Phòng</span>
        </div>
        <div className="step-line" />
        <div className="step-item">
          <div className="step-circle">2</div>
          <span className="step-title">2. Thanh Toán</span>
        </div>
        <div className="step-line" />
        <div className="step-item">
          <div className="step-circle">3</div>
          <span className="step-title">3. Hoàn Tất</span>
        </div>
      </div>

      {errorMsg && <div className="booking-error-banner">{errorMsg}</div>}

      <form onSubmit={handleSubmitBooking} className="booking-layout-grid">
        {/* Left Column: Form Fields */}
        <div className="booking-form-col">
          {/* Room Summary Header Card */}
          <Card padding="md" className="booking-room-summary-card">
            <div className="summary-card-inner">
              <img src={thumbnail} alt={room?.name} className="summary-thumb" />
              <div>
                <span className="summary-type">{room?.type}</span>
                <h3 className="summary-room-name">{room?.name}</h3>
                <div className="summary-location">
                  <FaMapMarkerAlt className="loc-icon" /> {room?.location}
                </div>
              </div>
            </div>
          </Card>

          {/* Dates & Guests */}
          <Card padding="lg" className="booking-section-card">
            <h3 className="card-section-title">
              <FaCalendarAlt className="title-icon" /> Thời Gian & Số Lượng Khách
            </h3>

            <div className="booking-dates-grid">
              <Input
                label="Ngày nhận phòng"
                type="date"
                value={startDate}
                min={formatDate(today)}
                onChange={(e) => setStartDate(e.target.value)}
              />

              <Input
                label="Ngày trả phòng"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="booking-counts-grid">
              <div className="input-group">
                <label className="input-label">Số lượng khách</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="input-field"
                >
                  <option value={1}>1 Người lớn</option>
                  <option value={2}>2 Người lớn</option>
                  <option value={3}>3 Người lớn</option>
                  <option value={4}>4 Người lớn</option>
                  <option value={5}>5+ Khách</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Số lượng phòng</label>
                <select
                  value={roomsCount}
                  onChange={(e) => setRoomsCount(Number(e.target.value))}
                  className="input-field"
                >
                  <option value={1}>1 Phòng</option>
                  <option value={2}>2 Phòng</option>
                  <option value={3}>3 Phòng</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Guest Contact Information */}
          <Card padding="lg" className="booking-section-card">
            <h3 className="card-section-title">
              <FaUsers className="title-icon" /> Thông Tin Người Đặt Phòng
            </h3>

            <div className="booking-inputs-flex">
              <Input
                label="Họ và tên khách chính"
                type="text"
                placeholder="Nguyễn Văn A"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />

              <Input
                label="Địa chỉ Email (Nhận mã xác nhận đặt phòng)"
                type="email"
                placeholder="example@gmail.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
              />

              <Input
                label="Số điện thoại di động"
                type="tel"
                placeholder="0912 345 678"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                required
              />

              <div className="input-group">
                <label className="input-label">Yêu cầu đặc biệt (Không bắt buộc)</label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Giường đôi lớn, nhận phòng muộn sau 18:00, tầng cao yên tĩnh..."
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          </Card>

          {/* Voucher */}
          <Card padding="md" className="booking-section-card">
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaTicketAlt color="var(--accent-dark)" /> Mã Giảm Giá / Ưu Đãi Độc Quyền
            </h4>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Input
                placeholder="Nhập mã voucher (VD: LUXSTAY10)"
                value={voucherCodeInput}
                onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                style={{ flex: 1 }}
              />
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleApplyVoucher}
                isLoading={isCheckingVoucher}
              >
                Áp Dụng
              </Button>
            </div>

            {voucherError && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '6px' }}>
                {voucherError}
              </p>
            )}

            {appliedVoucher && (
              <div className="applied-voucher-banner">
                <span>
                  <FaCheck /> Đã áp dụng mã ưu đãi <strong>{appliedVoucher.code}</strong> (-{appliedVoucher.discount}%)
                </span>
                <button
                  type="button"
                  onClick={() => setAppliedVoucher(null)}
                  style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Xóa
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Pricing & Checkout Button */}
        <div className="booking-sidebar-col">
          <PriceBreakdown
            pricePerNight={pricePerNight}
            nightCount={nights}
            roomsCount={roomsCount}
            discountAmount={discountAmount}
            voucherCode={appliedVoucher?.code}
          />

          <div style={{ marginTop: '24px' }}>
            <Button
              type="submit"
              variant="accent"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
            >
              Tiếp Tục Thanh Toán &rarr;
            </Button>

            <div className="booking-security-note">
              <FaShieldAlt color="var(--success)" />
              <span>Giao dịch an toàn & mã hóa bảo mật 256-bit</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
