import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaSwimmingPool,
  FaUtensils,
  FaSpa,
  FaCar,
  FaShieldAlt,
  FaAward,
  FaHeadset,
  FaChevronRight,
  FaFire,
  FaCrown,
  FaStar,
  FaQuoteLeft,
  FaConciergeBell,
  FaUmbrellaBeach,
  FaGlassCheers,
  FaDumbbell,
} from 'react-icons/fa';
import { apiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { SearchBar } from '../../components/rooms/SearchBar';
import { RoomGrid } from '../../components/rooms/RoomGrid';
import type { RoomItem } from '../../components/rooms/RoomCard';
import { Skeleton } from '../../components/feedback/Skeleton';
import { PriceTag } from '../../components/ui/PriceTag';
import { Button } from '../../components/ui/Button';
import './Home.css';

const BANNERS = [
  {
    id: '1',
    image: '/images/nn1.jpg',
    tag: 'BỘ SƯU TẬP NGHỈ DƯỠNG MÙA HÈ',
    title: 'Kỳ Nghỉ Trong Mơ Bên Bờ Biển Đà Nẵng',
    subtitle: 'Hòa mình vào làn nước xanh như ngọc với hồ bơi vô cực và đặc quyền bữa sáng thượng hạng tại phòng.',
  },
  {
    id: '2',
    image: '/images/nn2.jpg',
    tag: 'TRẢI NGHIỆM ĐẲNG CẤP HOÀNG GIA',
    title: 'Kiệt Tác Nghỉ Dưỡng Chuẩn 5 Sao Quốc Tế',
    subtitle: 'Phòng Suite view đại dương trọn vẹn kèm dịch vụ xe sang Limousine đưa đón sân bay tận nơi miễn phí.',
  },
  {
    id: '3',
    image: '/images/nn3.jpg',
    tag: 'ĐẶC QUYỀN HỘI VIÊN VIP LUXSTAY',
    title: 'Khoảnh Khắc Thư Thái Tuyệt Đối Giữa Thiên Nhiên',
    subtitle: 'Tận hưởng liệu trình Spa thảo mộc cao cấp và tiệc tối lãng mạn dưới ánh hoàng hôn thơ mộng.',
  },
];

const CATEGORIES = [
  { id: '1', name: 'Tất Cả Hạng Phòng', type: '' },
  { id: '2', name: 'Phòng VIP Hoàng Gia', type: 'VIP' },
  { id: '3', name: 'Suite Hướng Biển', type: 'SUITE' },
  { id: '4', name: 'Phòng Đôi Executive', type: 'DOUBLE' },
  { id: '5', name: 'Phòng Đơn Deluxe', type: 'SINGLE' },
];

const FLASH_DEALS = [
  {
    id: 'deal-1',
    name: 'Combo Cuối Tuần Nghỉ Dưỡng 3N2Đ',
    discount: '-40%',
    image: '/images/room1.jpg',
    originalPrice: 3200000,
    salePrice: 1920000,
    location: 'Bán Đảo Sơn Trà, Đà Nẵng',
    perk: 'Bao gồm buffet sáng & trà chiều',
  },
  {
    id: 'deal-2',
    name: 'Gói Trăng Mật Honeymoon Suite Lãng Mạn',
    discount: '-25%',
    image: '/images/room2.jpg',
    originalPrice: 5000000,
    salePrice: 3750000,
    location: 'Vịnh Nha Trang',
    perk: 'Tặng kèm rượu vang & hoa tươi',
  },
  {
    id: 'deal-3',
    name: 'Biệt Thự VIP Có Bể Bơi Riêng',
    discount: '-30%',
    image: '/images/room3.jpg',
    originalPrice: 8500000,
    salePrice: 5950000,
    location: 'Bãi Trường, Phú Quốc',
    perk: 'Quản gia riêng phục vụ 24/7',
  },
];

const TESTIMONIALS = [
  {
    id: '1',
    quote: 'Chất lượng phòng và dịch vụ vượt xa mong đợi. Cảnh hoàng hôn nhìn từ phòng Suite khiến cả gia đình tôi không thể quên!',
    author: 'Doanh nhân Trần Đình Khang',
    role: 'Hội viên Kim Cương LUXSTAY',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: '2',
    quote: 'Hồ bơi vô cực đẹp xuất sắc và nhân viên phục vụ cực kỳ chu đáo. Chắc chắn tôi sẽ quay lại trong kỳ nghỉ tới.',
    author: 'Chị Mai Linh Nguyễn',
    role: 'Khách hàng VIP Hà Nội',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: '3',
    quote: 'Ẩm thực buffet sáng 5 sao rất phong phú, vị trí sát biển thuận tiện di chuyển. Đặt phòng trên web tiện lợi và minh bạch giá.',
    author: 'Anh Lê Minh Quân',
    role: 'Du khách từ TP. Hồ Chí Minh',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  },
];

export const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeBanner, setActiveBanner] = useState(0);
  const [featuredRooms, setFeaturedRooms] = useState<RoomItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Auto-slide banner
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % BANNERS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Fetch featured rooms
  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoading(true);
      try {
        const url = selectedCategory
          ? `/rooms?type=${encodeURIComponent(selectedCategory)}&limit=3`
          : '/rooms?limit=3';
        const res = await apiClient.get(url);
        if (res.data?.success) {
          setFeaturedRooms((res.data.data.rooms || []).slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching featured rooms:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, [selectedCategory]);

  // Fetch favorites
  useEffect(() => {
    if (!user) {
      setFavoriteIds([]);
      return;
    }
    const fetchFavorites = async () => {
      try {
        const res = await apiClient.get('/favorites');
        if (res.data?.success) {
          const raw = res.data.data;
          const list = Array.isArray(raw) ? raw : (raw?.favorites || []);
          const ids = list.map((fav: any) => fav.roomId || fav.room?.id);
          setFavoriteIds(ids);
        }
      } catch (err) {
        console.error('Error fetching favorites:', err);
      }
    };
    fetchFavorites();
  }, [user]);

  const handleToggleFavorite = async (roomId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await apiClient.post(`/favorites/toggle/${roomId}`);
      if (res.data?.success) {
        setFavoriteIds((prev) =>
          prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
        );
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  return (
    <div className="home-page">
      {/* ── HERO BANNER ── */}
      <section className="hero-section">
        <div className="hero-carousel">
          {BANNERS.map((banner, index) => (
            <div
              key={banner.id}
              className={`hero-slide ${index === activeBanner ? 'active' : ''}`}
              style={{ backgroundImage: `url(${banner.image})` }}
            >
              <div className="hero-overlay" />
              <div className="container hero-content">
                <span className="hero-badge">
                  <FaCrown /> {banner.tag}
                </span>
                <h1 className="hero-title">{banner.title}</h1>
                <p className="hero-subtitle">{banner.subtitle}</p>
                <div className="hero-actions">
                  <Link to="/rooms">
                    <Button variant="accent" size="lg">
                      Khám Phá Phòng Nghỉ &rarr;
                    </Button>
                  </Link>
                  <a href="tel:19006868" className="hero-hotline-btn">
                    Tư Vấn Trực Tiếp: 1900 6868
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Dots */}
        <div className="carousel-dots">
          {BANNERS.map((_, idx) => (
            <button
              key={idx}
              className={`dot ${idx === activeBanner ? 'active' : ''}`}
              onClick={() => setActiveBanner(idx)}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Search Bar Console Overlay */}
        <div className="hero-search-wrapper container">
          <SearchBar />
        </div>
      </section>

      {/* ── LUXURY STATS STRIP ── */}
      <section className="luxury-stats-strip container">
        <div className="stats-inner">
          <div className="stat-item">
            <span className="stat-number">4.9 / 5.0</span>
            <span className="stat-label">⭐ Hơn 10.000 đánh giá xuất sắc</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">250+</span>
            <span className="stat-label">✨ Phòng nghỉ & Villa thượng lưu</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">🛡️ Cam kết giá độc quyền tốt nhất</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">👑 Dịch vụ Quản gia & Concierge</span>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES BAR ── */}
      <section className="container categories-section">
        <div className="categories-header-flex">
          <span className="section-eyebrow">DANH MỤC LỰA CHỌN</span>
          <h2 className="section-title">Chọn Không Gian Nghỉ Dưỡng Hoàn Hảo</h2>
        </div>
        <div className="categories-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`category-pill ${selectedCategory === cat.type ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.type)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* ── FEATURED ROOMS ── */}
      <section className="container section-spacing">
        <div className="section-header-flex">
          <div>
            <span className="section-eyebrow">BỘ SƯU TẬP CAO CẤP</span>
            <h2 className="section-title">Phòng Nghỉ & Suite Nổi Bật</h2>
            <p className="section-desc">Không gian kiến trúc đương đại kết hợp tinh hoa dịch vụ nghỉ dưỡng 5 sao</p>
          </div>
          <Link to="/rooms" className="view-all-link">
            Xem tất cả phòng <FaChevronRight size={12} />
          </Link>
        </div>

        {isLoading ? (
          <div className="room-grid" style={{ paddingBottom: '20px' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={{ background: '#fff', borderRadius: '18px', overflow: 'hidden', padding: '16px' }}>
                <Skeleton height="220px" borderRadius="14px" />
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Skeleton width="45%" height="16px" />
                  <Skeleton width="85%" height="24px" />
                  <Skeleton width="60%" height="16px" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <RoomGrid
            rooms={featuredRooms.slice(0, 3)}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </section>

      {/* ── FLASH DEALS (EXCLUSIVE PRIVILEGES) ── */}
      <section className="deals-section">
        <div className="container">
          <div className="section-header-flex">
            <div>
              <div className="deal-tag">
                <FaFire /> ƯU ĐÃI GIỚI HẠN TUẦN NÀY
              </div>
              <h2 className="section-title" style={{ color: '#FFFFFF' }}>
                Đặc Quyền Nghỉ Dưỡng Giá Tốt Nhất
              </h2>
              <p className="section-desc" style={{ color: '#94A3B8' }}>
                Số lượng có hạn • Tặng kèm dịch vụ ẩm thực và Spa miễn phí khi đặt trong tuần
              </p>
            </div>
            <Link to="/rooms?deal=true" className="view-all-link gold-link">
              Khám phá tất cả ưu đãi <FaChevronRight size={12} />
            </Link>
          </div>

          <div className="deals-grid">
            {FLASH_DEALS.map((deal) => (
              <div key={deal.id} className="deal-card">
                <div className="deal-img-wrap">
                  <img src={deal.image} alt={deal.name} />
                  <span className="deal-discount-badge">{deal.discount}</span>
                  <span className="deal-perk-badge">{deal.perk}</span>
                </div>
                <div className="deal-info">
                  <h3 className="deal-name">{deal.name}</h3>
                  <p className="deal-location">{deal.location}</p>
                  <div className="deal-price-row">
                    <span className="deal-old-price">
                      {new Intl.NumberFormat('vi-VN').format(deal.originalPrice)} ₫
                    </span>
                    <PriceTag price={deal.salePrice} size="md" />
                  </div>
                  <Link to="/rooms">
                    <Button variant="accent" size="sm" fullWidth style={{ marginTop: '14px' }}>
                      Đặt Ngay Bây Giờ &rarr;
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5-STAR RESORT EXPERIENCES ── */}
      <section className="container section-spacing">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span className="section-eyebrow">ĐẶC QUYỀN 5 SAO</span>
          <h2 className="section-title">Tại Sao Nên Lựa Chọn LUXSTAY?</h2>
          <p className="section-desc">Chúng tôi kiến tạo từng khoảnh khắc nghỉ ngơi trọn vẹn và đáng nhớ nhất cho bạn</p>
        </div>

        <div className="perks-grid">
          {/* Row 1 */}
          <div className="perk-card">
            <div className="perk-icon-wrap"><FaSwimmingPool /></div>
            <h3>Hồ Bơi Vô Cực Chân Mây</h3>
            <p>Tận hưởng tầm nhìn toàn cảnh đại dương từ tầng thượng với nước biển khoáng ấm và quầy bar cocktail cạnh hồ.</p>
          </div>

          <div className="perk-card">
            <div className="perk-icon-wrap"><FaUtensils /></div>
            <h3>Ẩm Thực Thượng Hạng</h3>
            <p>Buffet sáng quốc tế cao cấp cùng thực đơn hải sản tươi sống được bếp trưởng danh tiếng chế biến theo yêu cầu.</p>
          </div>

          <div className="perk-card">
            <div className="perk-icon-wrap"><FaSpa /></div>
            <h3>Sen Spa & Trị Liệu Thảo Dược</h3>
            <p>Thư giãn tinh thần và tái tạo năng lượng với các liệu pháp trị liệu cổ truyền từ thảo mộc thiên nhiên quý giá.</p>
          </div>

          <div className="perk-card">
            <div className="perk-icon-wrap"><FaCar /></div>
            <h3>Đưa Đón Siêu Xe Maybach</h3>
            <p>Dịch vụ xe sang đưa đón sân bay tận nơi, riêng tư, đảm bảo tính chuẩn xác và phong thái đẳng cấp thượng khách.</p>
          </div>

          {/* Row 2 */}
          <div className="perk-card">
            <div className="perk-icon-wrap"><FaConciergeBell /></div>
            <h3>Quản Gia Riêng 24/7</h3>
            <p>Chăm sóc chu đáo từ thủ tục check-in tại phòng, đặt bàn VIP đến phục vụ ẩm thực theo sở thích cá nhân.</p>
          </div>

          <div className="perk-card">
            <div className="perk-icon-wrap"><FaUmbrellaBeach /></div>
            <h3>Bãi Biển Riêng Biệt Lập</h3>
            <p>Thư thả dạo bước trên bãi cát trắng mịn màng với ghế tắm nắng riêng tư và các trò chơi thể thao nước.</p>
          </div>

          <div className="perk-card">
            <div className="perk-icon-wrap"><FaGlassCheers /></div>
            <h3>Sky Lounge Hoàng Hôn</h3>
            <p>Thưởng thức bộ sưu tập rượu vang danh tiếng và cocktail signature trong giai điệu Jazz êm dịu ngắm hoàng hôn.</p>
          </div>

          <div className="perk-card">
            <div className="perk-icon-wrap"><FaDumbbell /></div>
            <h3>Fitness & Yoga Hướng Biển</h3>
            <p>Trang thiết bị Technogym chuẩn Olympic cùng lớp thiền và Yoga đón ánh bình minh bên bờ sóng vỗ.</p>
          </div>
        </div>
      </section>

      {/* ── GUEST TESTIMONIALS ── */}
      <section className="testimonials-section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span className="section-eyebrow" style={{ color: 'var(--accent)' }}>CẢM NHẬN KHÁCH HÀNG</span>
            <h2 className="section-title">Những Chia Sẻ Từ Thượng Khách</h2>
          </div>

          <div className="testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.id} className="testimonial-card">
                <FaQuoteLeft className="quote-icon" />
                <div className="rating-stars">
                  {[...Array(t.rating)].map((_, i) => (
                    <FaStar key={i} color="var(--star)" />
                  ))}
                </div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-author">
                  <img src={t.avatar} alt={t.author} className="author-avatar" />
                  <div>
                    <h4 className="author-name">{t.author}</h4>
                    <span className="author-role">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GUARANTEE BANNER ── */}
      <section className="guarantee-section">
        <div className="container guarantee-inner">
          <div className="guarantee-item">
            <div className="guarantee-icon-box"><FaShieldAlt /></div>
            <div>
              <h4>Đặt Phòng Đảm Bảo 100%</h4>
              <p>Cam kết giá độc quyền tốt nhất, không phụ phí ẩn khi nhận phòng</p>
            </div>
          </div>
          <div className="guarantee-item">
            <div className="guarantee-icon-box"><FaAward /></div>
            <div>
              <h4>Tiêu Chuẩn 5 Sao Quốc Tế</h4>
              <p>Dịch vụ khách sạn chuẩn quốc tế được kiểm định chất lượng nghiêm ngặt</p>
            </div>
          </div>
          <div className="guarantee-item">
            <div className="guarantee-icon-box"><FaHeadset /></div>
            <div>
              <h4>Dịch Vụ Concierge 24/7</h4>
              <p>Đội ngũ chuyên viên luôn túc trực hỗ trợ mọi yêu cầu của bạn</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
