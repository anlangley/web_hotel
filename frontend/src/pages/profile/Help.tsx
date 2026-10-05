import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaHeadset, FaEnvelope } from 'react-icons/fa';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';

const FAQS = [
  {
    q: 'Thời gian nhận phòng (Check-in) và trả phòng (Check-out) là mấy giờ?',
    a: 'Thời gian nhận phòng tiêu chuẩn là từ 14:00 và trả phòng trước 12:00 trưa hôm sau. Nếu quý khách có nhu cầu nhận phòng sớm hoặc trả phòng muộn, vui lòng liên hệ lễ tân để được hỗ trợ tùy thuộc vào tình trạng phòng sẵn có.',
  },
  {
    q: 'Chính sách hủy phòng và hoàn tiền như thế nào?',
    a: 'Quý khách có thể hủy phòng miễn phí trước 24 giờ so với thời điểm nhận phòng. Các trường hợp hủy phòng cận giờ hoặc không đến nhận phòng có thể chịu phí theo quy định.',
  },
  {
    q: 'Giá phòng đã bao gồm buffet ăn sáng chưa?',
    a: 'Hầu hết các hạng phòng Deluxe, Suite và VIP tại LUXSTAY đều đã bao gồm buffet sáng miễn phí cho số lượng khách tiêu chuẩn.',
  },
  {
    q: 'Tôi có thể thanh toán bằng tiền mặt khi nhận phòng không?',
    a: 'Có, quý khách hoàn toàn có thể chọn hình thức "Thanh toán tại quầy lễ tân" khi đặt phòng và thanh toán bằng tiền mặt hoặc quẹt thẻ khi check-in.',
  },
];

export const Help: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="container" style={{ maxWidth: '780px', padding: '30px 20px 60px' }}>
      <PageHeader
        title="Trợ Giúp & Câu Hỏi Thường Gặp"
        subtitle="Giải đáp các thắc mắc phổ biến về dịch vụ đặt phòng của LUXSTAY"
        showBack
        backUrl="/profile"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <Card key={idx} padding="none" style={{ border: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'left',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                }}
              >
                <span>{faq.q}</span>
                {isOpen ? <FaChevronUp size={14} color="var(--accent-dark)" /> : <FaChevronDown size={14} color="var(--text-light)" />}
              </button>

              {isOpen && (
                <div style={{ padding: '0 20px 20px', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  {faq.a}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Contact box */}
      <Card padding="lg" style={{ backgroundColor: 'var(--primary)', color: 'var(--text-white)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
          Bạn vẫn cần thêm trợ giúp?
        </h3>
        <p style={{ color: '#D1D5DB', fontSize: '0.9rem', marginBottom: '20px' }}>
          Đội ngũ chăm sóc khách hàng của LUXSTAY luôn sẵn sàng đồng hành cùng bạn 24/7.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaHeadset size={20} color="var(--accent)" />
            <span>Hotline: <strong>1900 6868</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaEnvelope size={20} color="var(--accent)" />
            <span>Email: <strong>support@luxstay.vn</strong></span>
          </div>
        </div>
      </Card>
    </div>
  );
};
