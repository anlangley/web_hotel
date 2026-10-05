import React from 'react';
import { FaTicketAlt, FaClock } from 'react-icons/fa';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface VoucherItem {
  id: string;
  code: string;
  discount: number | string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface VoucherCardProps {
  voucher: VoucherItem;
  onApply?: (code: string) => void;
  selected?: boolean;
  className?: string;
}

export const VoucherCard: React.FC<VoucherCardProps> = ({
  voucher,
  onApply,
  selected = false,
  className = '',
}) => {
  const discountVal = Number(voucher.discount);
  const formattedEndDate = new Date(voucher.endDate).toLocaleDateString('vi-VN');

  return (
    <Card
      className={`voucher-card ${selected ? 'selected' : ''} ${className}`}
      padding="sm"
      style={{
        display: 'flex',
        alignItems: 'center',
        border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--surface)',
      }}
    >
      {/* Left Badge */}
      <div
        style={{
          width: '80px',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
          color: 'var(--text-white)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 8px',
          margin: '-8px 0 -8px -8px',
          fontWeight: 800,
        }}
      >
        <FaTicketAlt size={22} style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{discountVal}%</span>
        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          GIẢM GIÁ
        </span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, padding: '8px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--primary)',
              letterSpacing: '1px',
            }}
          >
            {voucher.code}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
          }}
        >
          <FaClock size={12} /> HSD: {formattedEndDate}
        </div>
      </div>

      {/* Action */}
      {onApply && (
        <div style={{ paddingRight: '8px' }}>
          <Button
            size="sm"
            variant={selected ? 'primary' : 'outline'}
            onClick={() => onApply(voucher.code)}
          >
            {selected ? 'Đã chọn' : 'Áp dụng'}
          </Button>
        </div>
      )}
    </Card>
  );
};
