import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaMapMarkerAlt,
  FaUsers,
  FaHeart,
  FaRegHeart,
  FaCalendarAlt,
  FaCheckCircle,
  FaStar,
  FaImages,
  FaBed,
  FaRulerCombined,
  FaEye,
  FaShieldAlt,
  FaConciergeBell,
  FaClock,
} from 'react-icons/fa';
import { apiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { PriceTag } from '../../components/ui/PriceTag';
import { StarRating } from '../../components/ui/StarRating';
import { AmenityBadge } from '../../components/rooms/AmenityBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ReviewModal } from '../../components/reviews/ReviewModal';
import { Skeleton } from '../../components/feedback/Skeleton';
import './RoomDetail.css';

export const RoomDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Review
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [myReview, setMyReview] = useState<any>(null);

  // Booking Widget States
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(formatDate(tomorrow));
  const [checkOut, setCheckOut] = useState(formatDate(dayAfter));
  const [guests, setGuests] = useState(2);

  // Calculate nights
  const calculateNights = () => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    return Math.max(1, Math.round(diff));
  };

  const nights = calculateNights();

  useEffect(() => {
    if (!id) return;
    fetchRoomDetail();
    if (user) {
      checkFavoriteStatus();
      fetchMyReview();
    }
  }, [id, user]);

  const fetchRoomDetail = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/rooms/${id}`);
      if (res.data?.success) {
        setRoom(res.data.data.room);
      }
    } catch (err) {
      console.error('Error fetching room detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const res = await apiClient.get('/favorites');
      if (res.data?.success) {
        const raw = res.data.data;
        const list = Array.isArray(raw) ? raw : (raw?.favorites || []);
        const ids = list.map((fav: any) => fav.roomId || fav.room?.id);
        setIsFavorite(ids.includes(id));
      }
    } catch (err) {
      console.error('Error checking favorite:', err);
    }
  };

  const fetchMyReview = async () => {
    try {
      const res = await apiClient.get(`/reviews/my-review/${id}`);
      if (res.data?.success) {
        setMyReview(res.data.data.review);
      }
    } catch (err) {
      // no review yet
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await apiClient.post(`/favorites/toggle/${id}`);
      if (res.data?.success) {
        setIsFavorite(!isFavorite);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleReviewSubmit = async (rating: number, comment: string, isEdit: boolean) => {
    try {
      const endpoint = isEdit ? `/reviews/${myReview.id}` : '/reviews';
      const method = isEdit ? 'put' : 'post';
      const res = await (apiClient as any)[method](endpoint, {
        roomId: id,
        rating,
        comment,
      });

      if (res.data?.success) {
        fetchRoomDetail();
        fetchMyReview();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error submitting review:', err);
      throw err;
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview) return false;
    try {
      const res = await apiClient.delete(`/reviews/${myReview.id}`);
      if (res.data?.success) {
        setMyReview(null);
        fetchRoomDetail();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting review:', err);
      throw err;
    }
  };

  const handleProceedBooking = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/booking?roomId=${id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '60px 0' }}>
        <Skeleton height="450px" borderRadius="20px" />
        <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
          <div>
            <Skeleton height="44px" width="60%" />
            <Skeleton height="24px" width="30%" style={{ margin: '14px 0' }} />
            <Skeleton height="180px" style={{ marginTop: '24px' }} />
          </div>
          <div>
            <Skeleton height="360px" borderRadius="18px" />
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>Không tìm thấy thông tin phòng</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Phòng bạn đang tìm kiếm có thể đã tạm đóng hoặc không tồn tại.
        </p>
        <Button variant="accent" onClick={() => navigate('/rooms')}>
          Quay lại danh sách phòng
        </Button>
      </div>
    );
  }

  const rawImages = room.images && room.images.length > 0 ? room.images : [{ url: '/images/room1.jpg' }];
  const formattedImages: string[] = rawImages.map((img: any) =>
    typeof img === 'string' ? img : img.url || '/images/room1.jpg'
  );

  // Guarantee at least 5 images for the luxury mosaic collage
  const galleryImages = [
    formattedImages[0] || '/images/room1.jpg',
    formattedImages[1] || '/images/room2.jpg',
    formattedImages[2] || '/images/room3.jpg',
    formattedImages[3] || '/images/nn1.jpg',
    formattedImages[4] || '/images/nn2.jpg',
  ];

  const getParsedAmenities = (): any[] => {
    if (!room.amenities) {
      return ['Wifi tốc độ cao', 'Điều hòa 2 chiều', 'Smart TV 55 inch', 'Ăn sáng buffet', 'Hồ bơi vô cực', 'Bồn tắm nằm'];
    }
    if (Array.isArray(room.amenities)) {
      return room.amenities;
    }
    if (typeof room.amenities === 'string') {
      try {
        const parsed = JSON.parse(room.amenities);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return room.amenities.split(',').map((s: string) => s.trim());
      }
    }
    return ['Wifi tốc độ cao', 'Điều hòa 2 chiều', 'Smart TV'];
  };

  const amenitiesList = getParsedAmenities();
  const totalPrice = Number(room.pricePerNight) * nights;

  return (
    <div className="container room-detail-page">
      {/* ── TOP BREADCRUMB & HEADER ── */}
      <div className="detail-top-bar">
        <div className="detail-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <Link to="/rooms">Phòng nghỉ</Link>
          <span>/</span>
          <span className="current-crumb">{room.name}</span>
        </div>

        <div className="detail-top-actions">
          <button
            className={`detail-fav-btn ${isFavorite ? 'active' : ''}`}
            onClick={handleToggleFavorite}
            aria-label="Yêu thích"
          >
            {isFavorite ? <FaHeart color="#EF4444" /> : <FaRegHeart />}
            <span>{isFavorite ? 'Đã yêu thích' : 'Lưu vào yêu thích'}</span>
          </button>
        </div>
      </div>

      <div className="detail-title-row">
        <div>
          <span className="detail-type-badge">{room.type}</span>
          <h1 className="detail-title">{room.name}</h1>
          <div className="detail-location-meta">
            <FaMapMarkerAlt className="loc-icon" />
            <span>{room.location}</span>
            <span className="meta-dot">•</span>
            <StarRating rating={Number(room.avgRating) || 5.0} size={15} />
            <span className="reviews-count">({room.reviewCount || 0} nhận xét từ khách)</span>
          </div>
        </div>
      </div>

      {/* ── LUXURY MOSAIC PHOTO GALLERY ── */}
      <div className="mosaic-gallery-grid">
        <div className="mosaic-main" onClick={() => setActiveImage(0)}>
          <img
            src={formattedImages[activeImage] || galleryImages[0]}
            alt={room.name}
            className="mosaic-img"
          />
        </div>

        <div className="mosaic-sub-grid">
          {galleryImages.slice(1, 5).map((imgUrl, idx) => (
            <div
              key={idx}
              className={`mosaic-sub-item ${activeImage === idx + 1 ? 'active-thumb' : ''}`}
              onClick={() => setActiveImage((idx + 1) % formattedImages.length)}
            >
              <img src={imgUrl} alt={`${room.name} photo ${idx + 2}`} className="mosaic-img" />
              {idx === 3 && (
                <div className="all-photos-overlay">
                  <FaImages /> <span>+{formattedImages.length} Hình ảnh</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── TWO-COLUMN DETAILS & BOOKING CONSOLE ── */}
      <div className="room-detail-layout">
        {/* Left Column: Details, Amenities, Policies, Reviews */}
        <div className="room-info-column">
          {/* Quick Specs Highlight Bar */}
          <div className="quick-specs-bar">
            <div className="spec-card">
              <FaUsers className="spec-card-icon" />
              <div className="spec-card-text">
                <span className="spec-card-label">Sức Chứa</span>
                <strong>{room.capacityAdults || 2} Người lớn</strong>
              </div>
            </div>

            <div className="spec-card">
              <FaBed className="spec-card-icon" />
              <div className="spec-card-text">
                <span className="spec-card-label">Giường Ngủ</span>
                <strong>1 Giường King Lớn</strong>
              </div>
            </div>

            <div className="spec-card">
              <FaRulerCombined className="spec-card-icon" />
              <div className="spec-card-text">
                <span className="spec-card-label">Diện Tích</span>
                <strong>65 m²</strong>
              </div>
            </div>

            <div className="spec-card">
              <FaEye className="spec-card-icon" />
              <div className="spec-card-text">
                <span className="spec-card-label">Tầm Nhìn</span>
                <strong>Hướng Biển Trọn Vẹn</strong>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="detail-section">
            <h3 className="section-heading">Không Gian Nghỉ Dưỡng Thượng Lưu</h3>
            <p className="detail-description">
              {room.description ||
                'Được thiết kế theo chuẩn mực nghỉ dưỡng 5 sao quốc tế, căn phòng là sự kết hợp hoàn hảo giữa phong cách đương đại tinh tế và vẻ đẹp thiên nhiên trác tuyệt. Ban công riêng rộng mở đón trọn làn gió biển trong lành cùng toàn cảnh bình minh rực rỡ, mang đến cho quý khách trải nghiệm nghỉ ngơi thư thái và xa hoa nhất.'}
            </p>
          </div>

          {/* Amenities */}
          <div className="detail-section">
            <h3 className="section-heading">Đặc Quyền & Tiện Nghi Chuẩn 5 Sao</h3>
            <div className="amenities-list">
              {amenitiesList.map((amenity: any, idx: number) => (
                <AmenityBadge key={idx} name={amenity} />
              ))}
            </div>
          </div>

          {/* Hotel Policies */}
          <div className="detail-section policies-section">
            <h3 className="section-heading">Quy Định & Chính Sách Khách Sạn</h3>
            <div className="policies-grid">
              <div className="policy-item">
                <FaClock className="policy-icon" />
                <div>
                  <strong>Thời gian Nhận / Trả phòng</strong>
                  <p>Nhận phòng từ 14:00 • Trả phòng trước 12:00 trưa</p>
                </div>
              </div>
              <div className="policy-item">
                <FaShieldAlt className="policy-icon" />
                <div>
                  <strong>Chính sách Hủy phòng linh hoạt</strong>
                  <p>Miễn phí hủy phòng trước 48 giờ so với ngày nhận phòng</p>
                </div>
              </div>
              <div className="policy-item">
                <FaConciergeBell className="policy-icon" />
                <div>
                  <strong>Dịch vụ Quản gia & Phục vụ tại phòng</strong>
                  <p>Túc trực 24/7 qua phím bấm gọi dịch vụ trên điện thoại phòng</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="detail-section reviews-section">
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <div>
                <h3 className="section-heading" style={{ marginBottom: '6px' }}>
                  Đánh Giá Từ Thượng Khách
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaStar color="var(--star)" />
                  <strong style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>
                    {(Number(room.avgRating) || 5).toFixed(1)} / 5.0
                  </strong>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    ({room.reviewCount || 0} nhận xét thực tế)
                  </span>
                </div>
              </div>

              {user && (
                <Button variant="outline" size="sm" onClick={() => setReviewModalOpen(true)}>
                  {myReview ? 'Chỉnh Sửa Nhận Xét' : 'Viết Nhận Xét Của Bạn'}
                </Button>
              )}
            </div>

            {room.reviews && room.reviews.length > 0 ? (
              <div className="reviews-list">
                {room.reviews.map((rev: any) => (
                  <Card key={rev.id} padding="md" className="review-card-item">
                    <div className="flex-between" style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="reviewer-avatar">
                          {rev.user?.avatarUrl ? (
                            <img src={rev.user.avatarUrl} alt={rev.user.name} />
                          ) : (
                            <span>{(rev.user?.name || 'K')[0].toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            {rev.user?.name || 'Khách hàng'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {new Date(rev.createdAt).toLocaleDateString('vi-VN')} • Đã lưu trú
                          </div>
                        </div>
                      </div>

                      <StarRating rating={rev.rating} size={14} />
                    </div>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                      {rev.comment}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="no-reviews-box">
                Chưa có đánh giá nào cho phòng này. Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận!
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Luxury Sticky Booking Console */}
        <div className="room-booking-sidebar">
          <Card padding="lg" className="sticky-booking-card">
            <div className="booking-card-price-header">
              <div>
                <span className="booking-price-prefix">Giá mỗi đêm từ</span>
                <PriceTag price={room.pricePerNight} size="lg" />
              </div>
              <span className="room-avail-tag">
                <FaCheckCircle color="var(--success)" /> Còn phòng trống
              </span>
            </div>

            <div className="booking-form-box">
              <div className="booking-dates-row">
                <div className="date-field">
                  <label>
                    <FaCalendarAlt /> Nhận phòng
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    min={formatDate(today)}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                </div>

                <div className="date-field">
                  <label>
                    <FaCalendarAlt /> Trả phòng
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>
              </div>

              <div className="guest-select-field">
                <label>
                  <FaUsers /> Số lượng khách
                </label>
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                  <option value={1}>1 Người lớn</option>
                  <option value={2}>2 Người lớn</option>
                  <option value={3}>3 Người lớn</option>
                  <option value={4}>4 Người lớn</option>
                </select>
              </div>

              <div className="booking-price-calc">
                <div className="calc-row">
                  <span>
                    {new Intl.NumberFormat('vi-VN').format(room.pricePerNight)} ₫ x {nights} đêm
                  </span>
                  <span>{new Intl.NumberFormat('vi-VN').format(totalPrice)} ₫</span>
                </div>
                <div className="calc-row">
                  <span>Phí dịch vụ & dọn phòng</span>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>Miễn phí</span>
                </div>
                <div className="calc-row">
                  <span>Thuế VAT & Phí resort (8%)</span>
                  <span>{new Intl.NumberFormat('vi-VN').format(Math.round(totalPrice * 0.08))} ₫</span>
                </div>
                <div className="calc-row total-row">
                  <span>Tổng tiền dự tính:</span>
                  <strong className="calc-total-val">
                    {new Intl.NumberFormat('vi-VN').format(Math.round(totalPrice * 1.08))} ₫
                  </strong>
                </div>
              </div>

              <Button
                variant="accent"
                size="lg"
                fullWidth
                onClick={handleProceedBooking}
                style={{ marginTop: '20px' }}
              >
                Tiến Hành Đặt Phòng &rarr;
              </Button>

              <div className="booking-guarantee-note">
                <FaCheckCircle color="var(--success)" />
                <span>Không trừ tiền ngay • Xác nhận đặt phòng tức thì</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        roomId={room.id}
        initialReview={myReview}
        onSubmit={handleReviewSubmit}
        onDelete={handleDeleteReview}
      />
    </div>
  );
};
