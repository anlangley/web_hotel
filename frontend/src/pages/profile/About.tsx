import React from 'react';
import { FaHotel, FaAward, FaHeart, FaGlobe } from 'react-icons/fa';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';

export const About: React.FC = () => {
  return (
    <div className="container" style={{ maxWidth: '780px', padding: '30px 20px 60px' }}>
      <PageHeader
        title="Về Chúng Tôi"
        subtitle="Giới thiệu về LUXSTAY Hotel & Resort"
        showBack
        backUrl="/profile"
      />

      <Card padding="lg" style={{ marginBottom: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary)',
              color: 'var(--accent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              marginBottom: '12px',
            }}
          >
            <FaHotel />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
            LUXSTAY HOTEL & RESORT
          </h2>
          <p style={{ color: 'var(--accent-dark)', fontWeight: 600, letterSpacing: '2px', fontSize: '0.85rem' }}>
            ĐẲNG CẤP NGHỈ DƯỠNG QUỐC TẾ
          </p>
        </div>

        <p style={{ color: 'var(--text-primary)', lineHeight: 1.8, marginBottom: '16px' }}>
          Được thành lập với sứ mệnh mang đến trải nghiệm nghỉ dưỡng sang trọng bậc nhất, LUXSTAY Hotel & Resort tự hào là chuỗi khách sạn và khu nghỉ dưỡng hàng đầu tại các thành phố biển xinh đẹp của Việt Nam.
        </p>

        <p style={{ color: 'var(--text-primary)', lineHeight: 1.8 }}>
          Với hệ thống phòng nghỉ cao cấp được trang bị tiện nghi 5 sao, ẩm thực tinh hoa quốc tế, dịch vụ chăm sóc tận tâm và bể bơi vô cực ngắm trọn đại dương, chúng tôi cam kết mang lại kỳ nghỉ thư thái và đáng nhớ nhất cho mọi du khách.
        </p>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card padding="md" style={{ textAlign: 'center' }}>
          <FaAward size={32} color="var(--accent)" style={{ marginBottom: '8px' }} />
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px' }}>Top 10 Resort</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Giải thưởng du lịch nghỉ dưỡng xuất sắc 2024</p>
        </Card>

        <Card padding="md" style={{ textAlign: 'center' }}>
          <FaHeart size={32} color="#EF4444" style={{ marginBottom: '8px' }} />
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px' }}>98% Hài Lòng</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hơn 50.000 lượt khách đánh giá xuất sắc</p>
        </Card>

        <Card padding="md" style={{ textAlign: 'center' }}>
          <FaGlobe size={32} color="var(--secondary)" style={{ marginBottom: '8px' }} />
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px' }}>Tiêu Chuẩn 5 Sao</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Dịch vụ phòng và an ninh chuẩn quốc tế</p>
        </Card>
      </div>
    </div>
  );
};
