import React from 'react';
import { FaCreditCard, FaQrcode, FaMoneyBillWave, FaShieldAlt } from 'react-icons/fa';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const PaymentMethods: React.FC = () => {
  const methods = [
    {
      title: 'VietQR / Chuyển khoản ngân hàng',
      desc: 'Quét mã VietQR qua mọi ứng dụng ngân hàng tại Việt Nam (MB Bank, Vietcombank, Techcombank...).',
      icon: <FaQrcode size={28} color="#005BAA" />,
      status: 'Khuyên dùng',
    },
    {
      title: 'Ví MoMo',
      desc: 'Thanh toán trực tiếp bằng số dư ví MoMo hoặc tài nguyên liên kết an toàn.',
      icon: <FaCreditCard size={28} color="#A50064" />,
      status: 'Hỗ trợ',
    },
    {
      title: 'Thanh toán khi nhận phòng (Tại quầy)',
      desc: 'Thanh toán bằng tiền mặt hoặc thẻ quốc tế (Visa, Mastercard, JCB) khi quý khách làm thủ tục check-in tại sảnh.',
      icon: <FaMoneyBillWave size={28} color="#10B981" />,
      status: 'Hỗ trợ',
    },
  ];

  return (
    <div className="container" style={{ maxWidth: '780px', padding: '30px 20px 60px' }}>
      <PageHeader
        title="Phương Thức Thanh Toán"
        subtitle="Các kênh thanh toán được hỗ trợ trên hệ thống LUXSTAY Resort"
        showBack
        backUrl="/profile"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {methods.map((m, idx) => (
          <Card key={idx} padding="lg">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div style={{ marginTop: '4px' }}>{m.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {m.title}
                  </h3>
                  <Badge variant={idx === 0 ? 'accent' : 'primary'} size="sm">
                    {m.status}
                  </Badge>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {m.desc}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div
        style={{
          marginTop: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          backgroundColor: '#F1F5F9',
          borderRadius: 'var(--radius-lg)',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
        }}
      >
        <FaShieldAlt color="var(--success)" size={24} style={{ flexShrink: 0 }} />
        <span>
          Mọi giao dịch thanh toán trực tuyến tại LUXSTAY đều được mã hóa bằng giao thức SSL và tuân thủ các chuẩn an toàn tài chính quốc tế.
        </span>
      </div>
    </div>
  );
};
