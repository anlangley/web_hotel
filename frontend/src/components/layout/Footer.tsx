import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaHotel,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCrown,
  FaAward,
  FaShieldAlt,
  FaPaperPlane,
} from 'react-icons/fa';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      {/* VIP Trust & Accolades Banner */}
      <div className="footer-accolades-strip">
        <div className="container accolades-inner">
          <div className="accolade-item">
            <FaCrown className="accolade-icon" />
            <span>Top 10 Khu Nghỉ Dưỡng Sang Trọng Nhất Châu Á</span>
          </div>
          <div className="accolade-item">
            <FaAward className="accolade-icon" />
            <span>World Luxury Hotel Awards Winner 2025</span>
          </div>
          <div className="accolade-item">
            <FaShieldAlt className="accolade-icon" />
            <span>Cam Kết Giá Độc Quyền & Dịch Vụ 5 Sao Chuẩn Quốc Tế</span>
          </div>
        </div>
      </div>

      <div className="container footer-content">
        {/* Brand & Newsletter */}
        <div className="footer-col brand-col">
          <div className="site-logo footer-logo">
            <div className="logo-crest">
              <FaCrown className="crown-icon" />
              <FaHotel className="hotel-icon" />
            </div>
            <div className="logo-text">
              <span className="logo-title" style={{ color: '#FFFFFF' }}>LUXSTAY</span>
              <span className="logo-subtitle">HOTEL & RESORT • 5-STAR</span>
            </div>
          </div>
          <p className="footer-desc">
            Nơi hội tụ tinh hoa kiến trúc và dịch vụ nghỉ dưỡng thượng lưu. Trải nghiệm không gian xa hoa, ẩm thực tinh túy cùng sự phục vụ tận tâm bậc nhất.
          </p>

          <div className="newsletter-box">
            <span className="newsletter-title">Nhận ưu đãi độc quyền hội viên VIP</span>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Nhập địa chỉ email của bạn..." className="newsletter-input" />
              <button type="submit" className="newsletter-btn" aria-label="Đăng ký nhận tin">
                <FaPaperPlane />
              </button>
            </form>
          </div>
        </div>

        {/* Column 2: Navigation */}
        <div className="footer-col">
          <h4 className="footer-title">Khám Phá Phòng Nghỉ</h4>
          <ul className="footer-links">
            <li><Link to="/rooms">Tất cả phòng nghỉ</Link></li>
            <li><Link to="/rooms?type=VIP">Phòng VIP Hoàng Gia</Link></li>
            <li><Link to="/rooms?type=SUITE">Phòng Suite Hướng Biển</Link></li>
            <li><Link to="/rooms?type=DOUBLE">Phòng Đôi Executive</Link></li>
            <li><Link to="/rooms?type=SINGLE">Phòng Đơn Delux</Link></li>
          </ul>
        </div>

        {/* Column 3: Customer Care */}
        <div className="footer-col">
          <h4 className="footer-title">Dịch Vụ & Hỗ Trợ</h4>
          <ul className="footer-links">
            <li><Link to="/profile/help">Trung tâm trợ giúp khách hàng</Link></li>
            <li><Link to="/profile/about">Về thương hiệu LUXSTAY</Link></li>
            <li><Link to="/profile/payment-methods">Phương thức thanh toán an toàn</Link></li>
            <li><Link to="/history">Tra cứu tình trạng đặt phòng</Link></li>
            <li><Link to="/profile/favorites">Danh sách yêu thích đã lưu</Link></li>
          </ul>
        </div>

        {/* Column 4: Contact */}
        <div className="footer-col">
          <h4 className="footer-title">Dịch Vụ Concierge 24/7</h4>
          <div className="footer-contact-item">
            <div className="contact-icon-wrap"><FaPhoneAlt /></div>
            <div>
              <span className="contact-label">Hotline Đặt Phòng & CSKH</span>
              <strong className="contact-val">1900 6868 / 028 3822 8888</strong>
            </div>
          </div>
          <div className="footer-contact-item">
            <div className="contact-icon-wrap"><FaEnvelope /></div>
            <div>
              <span className="contact-label">Email Concierge</span>
              <strong className="contact-val">concierge@luxstay.vn</strong>
            </div>
          </div>
          <div className="footer-contact-item">
            <div className="contact-icon-wrap"><FaMapMarkerAlt /></div>
            <div>
              <span className="contact-label">Khu Nghỉ Dưỡng Chính</span>
              <span className="contact-val-sub">Đường Võ Nguyên Giáp, Bán Đảo Sơn Trà, Đà Nẵng</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© {new Date().getFullYear()} LUXSTAY Hotel & Resort International. Tất cả quyền được bảo lưu.</p>
          <div className="footer-badges">
            <span className="safe-badge">🔒 256-Bit SSL Encrypted</span>
            <span className="safe-badge">💳 VietQR • MoMo • Visa • Master</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
