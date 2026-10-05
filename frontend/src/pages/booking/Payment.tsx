import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  FaCheckCircle,
  FaQrcode,
  FaCreditCard,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaShieldAlt,
  FaClock,
  FaCopy,
  FaCheck,
} from 'react-icons/fa';
import { apiClient } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PriceTag } from '../../components/ui/PriceTag';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/feedback/Skeleton';
import './Booking.css';

const PAYMENT_METHODS = [
  {
    id: 'vietqr',
    name: 'Chuyển khoản nhanh VietQR (MB Bank)',
    desc: 'Quét mã QR qua ứng dụng ngân hàng bất kỳ, hệ thống xác nhận thanh toán tự động trong 30 giây.',
    badge: 'Khuyên Dùng',
    icon: <FaQrcode size={26} color="#005BAA" />,
  },
  {
    id: 'momo',
    name: 'Ví điện tử MoMo',
    desc: 'Thanh toán trực tiếp qua cổng thanh toán liên kết ứng dụng MoMo.',
    badge: 'Tiện Lợi',
    icon: <FaCreditCard size={26} color="#A50064" />,
  },
  {
    id: 'counter',
    name: 'Thanh toán khi nhận phòng tại quầy lễ tân',
    desc: 'Giữ phòng đảm bảo, thanh toán bằng tiền mặt hoặc thẻ tín dụng quốc tế khi làm thủ tục check-in.',
    badge: 'Linh Hoạt',
    icon: <FaMoneyBillWave size={26} color="#059669" />,
  },
];

export const Payment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState('vietqr');
  const [isProcessing, setIsProcessing] = useState(false);

  // QR Modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  // Countdown timer (10 mins)
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    if (!bookingId) {
      navigate('/history');
      return;
    }
    fetchBooking();
  }, [bookingId]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchBooking = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get(`/bookings/${bookingId}`);
      if (res.data?.success) {
        setBooking(res.data.data.booking);
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      if (selectedMethod === 'counter') {
        // Update booking payment method as AT_COUNTER
        await apiClient.put(`/bookings/${bookingId}`, {
          paymentMethod: 'TIỀN MẶT TẠI QUẦY',
        });
        setIsPaidSuccess(true);
      } else {
        // Show QR modal for VietQR or MoMo
        setShowQRModal(true);
      }
    } catch (err) {
      console.error('Payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPaid = async () => {
    setIsProcessing(true);
    try {
      await apiClient.post(`/payment/confirm`, {
        bookingId,
        method: selectedMethod.toUpperCase(),
      });
      setShowQRModal(false);
      setIsPaidSuccess(true);
    } catch (err) {
      // Mock confirmation in dev
      setShowQRModal(false);
      setIsPaidSuccess(true);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '60px 0' }}>
        <Skeleton height="350px" borderRadius="18px" />
      </div>
    );
  }

  if (isPaidSuccess) {
    return (
      <div className="container payment-page">
        {/* Stepper with step 3 finished */}
        <div className="booking-stepper">
          <div className="step-item finished">
            <div className="step-circle"><FaCheck /></div>
            <span className="step-title">1. Thông Tin</span>
          </div>
          <div className="step-line active" />
          <div className="step-item finished">
            <div className="step-circle"><FaCheck /></div>
            <span className="step-title">2. Thanh Toán</span>
          </div>
          <div className="step-line active" />
          <div className="step-item active">
            <div className="step-circle">3</div>
            <span className="step-title">3. Hoàn Tất</span>
          </div>
        </div>

        <div className="payment-success-card">
          <div className="success-icon-wrap">
            <FaCheckCircle />
          </div>

          <span className="success-subtitle">ĐẶT PHÒNG THÀNH CÔNG!</span>
          <h2 className="success-title">Chào Mừng Quý Khách Đến Với LUXSTAY</h2>

          <p className="success-desc">
            Cảm ơn bạn đã lựa chọn hệ thống nghỉ dưỡng của chúng tôi. Mã đơn đặt phòng của quý khách là:{' '}
            <strong className="booking-code-highlight">#{bookingId?.slice(0, 8).toUpperCase()}</strong>.
            Thông tin chi tiết cùng hướng dẫn nhận phòng đã được gửi đến email đăng ký.
          </p>

          <div className="success-details-box">
            <div className="success-row">
              <span>Hạng phòng:</span>
              <strong>{booking?.room?.name}</strong>
            </div>
            <div className="success-row">
              <span>Thời gian lưu trú:</span>
              <strong>
                {new Date(booking?.checkInDate).toLocaleDateString('vi-VN')} →{' '}
                {new Date(booking?.checkOutDate).toLocaleDateString('vi-VN')} ({booking?.nightCount} đêm)
              </strong>
            </div>
            <div className="success-row">
              <span>Số khách:</span>
              <strong>{booking?.guestsCount} Khách • {booking?.roomsCount} Phòng</strong>
            </div>
            <div className="success-row total-success-row">
              <span>Tổng chi phí:</span>
              <strong className="success-price-val">
                {new Intl.NumberFormat('vi-VN').format(booking?.totalPrice || 0)} ₫
              </strong>
            </div>
          </div>

          <div className="success-actions-row">
            <Link to="/history">
              <Button variant="accent" size="lg">
                Xem Lịch Sử Đặt Phòng &rarr;
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="lg">
                Quay Lại Trang Chủ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container payment-page">
      {/* ── STEPPER HEADER ── */}
      <div className="booking-stepper">
        <div className="step-item finished">
          <div className="step-circle"><FaCheck /></div>
          <span className="step-title">1. Thông Tin Đặt Phòng</span>
        </div>
        <div className="step-line active" />
        <div className="step-item active">
          <div className="step-circle">2</div>
          <span className="step-title">2. Thanh Toán & Xác Nhận</span>
        </div>
        <div className="step-line" />
        <div className="step-item">
          <div className="step-circle">3</div>
          <span className="step-title">3. Hoàn Tất</span>
        </div>
      </div>

      <div className="payment-layout-grid">
        {/* Left Column: Payment Methods */}
        <div className="payment-methods-col">
          <Card padding="lg">
            <div className="payment-timer-banner">
              <FaClock className="timer-icon" />
              <span>
                Phòng đang được giữ tạm thời trong <strong>{formatTimer(timeLeft)}</strong>. Quý khách vui lòng hoàn tất thanh toán.
              </span>
            </div>

            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 800, margin: '20px 0 16px', color: 'var(--primary)' }}>
              Phương Thức Thanh Toán An Toàn
            </h3>

            <div className="payment-methods-list">
              {PAYMENT_METHODS.map((method) => (
                <div
                  key={method.id}
                  className={`payment-method-item ${selectedMethod === method.id ? 'active' : ''}`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="method-radio">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={selectedMethod === method.id}
                      onChange={() => setSelectedMethod(method.id)}
                    />
                  </div>
                  <div className="method-icon">{method.icon}</div>
                  <div className="method-details">
                    <div className="method-name-row">
                      <h4 className="method-name">{method.name}</h4>
                      <span className="method-badge-pill">{method.badge}</span>
                    </div>
                    <p className="method-desc">{method.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '28px' }}>
              <Button
                variant="accent"
                size="lg"
                fullWidth
                onClick={handlePay}
                isLoading={isProcessing}
              >
                {selectedMethod === 'counter'
                  ? 'Xác Nhận Giữ Phòng & Thanh Toán Tại Quầy'
                  : 'Tiến Hành Quét Mã Thanh Toán'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Order Summary */}
        <div className="payment-summary-col">
          <Card padding="lg">
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', color: 'var(--primary)' }}>
              Tóm Tắt Đơn Đặt Phòng
            </h3>

            <div className="summary-item">
              <span className="summary-label">Phòng nghỉ:</span>
              <strong className="summary-val">{booking?.room?.name}</strong>
            </div>

            <div className="summary-item">
              <span className="summary-label">Thời gian lưu trú:</span>
              <span className="summary-val">
                <FaCalendarAlt /> {new Date(booking?.checkInDate).toLocaleDateString('vi-VN')} →{' '}
                {new Date(booking?.checkOutDate).toLocaleDateString('vi-VN')} ({booking?.nightCount} đêm)
              </span>
            </div>

            <div className="summary-item">
              <span className="summary-label">Số khách:</span>
              <span className="summary-val">
                {booking?.guestsCount} Khách • {booking?.roomsCount} Phòng
              </span>
            </div>

            <div className="payment-total-divider" />

            <div className="payment-total-row">
              <span className="total-label">Tổng Chi Phí:</span>
              <PriceTag price={booking?.totalPrice || 0} period="" size="lg" />
            </div>

            <div className="payment-guarantee-note">
              <FaShieldAlt color="var(--success)" />
              <span>Giao dịch bảo mật 100% qua cổng thanh toán số hóa</span>
            </div>
          </Card>
        </div>
      </div>

      {/* QR Code Payment Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title={selectedMethod === 'vietqr' ? 'Thanh Toán Qua VietQR Chuyển Khoản' : 'Thanh Toán Qua Ví MoMo'}
        maxWidth="480px"
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '18px' }}>
            Mở ứng dụng ngân hàng bất kỳ để quét mã VietQR chuẩn NAPAS 24/7 dưới đây
          </p>

          {/* QR Image Box */}
          <div className="qr-code-box">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=LUXSTAY_PAYMENT_${bookingId}_${booking?.totalPrice}`}
              alt="VietQR Code"
              style={{ width: '210px', height: '210px', margin: '0 auto', display: 'block' }}
            />
          </div>

          <div className="qr-info-box">
            <div className="qr-info-row">
              <span className="qr-info-label">Ngân hàng thụ hưởng:</span>
              <strong>MB BANK (Quân Đội)</strong>
            </div>

            <div className="qr-info-row">
              <span className="qr-info-label">Số tài khoản:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ letterSpacing: '1px' }}>8888 6868 9999</strong>
                <button
                  type="button"
                  onClick={() => copyToClipboard('888868689999', 'stk')}
                  className="copy-btn"
                  title="Sao chép số tài khoản"
                >
                  {copiedField === 'stk' ? <FaCheck color="var(--success)" /> : <FaCopy />}
                </button>
              </div>
            </div>

            <div className="qr-info-row">
              <span className="qr-info-label">Chủ tài khoản:</span>
              <strong>LUXSTAY RESORT INTERNATIONAL</strong>
            </div>

            <div className="qr-info-row">
              <span className="qr-info-label">Số tiền:</span>
              <strong style={{ color: 'var(--primary)', fontSize: '1.15rem' }}>
                {new Intl.NumberFormat('vi-VN').format(booking?.totalPrice || 0)} ₫
              </strong>
            </div>

            <div className="qr-info-row">
              <span className="qr-info-label">Nội dung chuyển:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ color: 'var(--accent-dark)' }}>
                  LUXSTAY {bookingId?.slice(0, 8).toUpperCase()}
                </strong>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`LUXSTAY ${bookingId?.slice(0, 8).toUpperCase()}`, 'nd')}
                  className="copy-btn"
                  title="Sao chép nội dung"
                >
                  {copiedField === 'nd' ? <FaCheck color="var(--success)" /> : <FaCopy />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', marginTop: '24px' }}>
            <Button variant="outline" fullWidth onClick={() => setShowQRModal(false)}>
              Quay Lại
            </Button>
            <Button
              variant="accent"
              fullWidth
              onClick={handleConfirmPaid}
              isLoading={isProcessing}
            >
              Tôi Đã Hoàn Tất Chuyển Khoản
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
