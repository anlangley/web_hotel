import React from 'react';
import { PriceTag } from '../ui/PriceTag';
import { Card } from '../ui/Card';

interface PriceBreakdownProps {
  pricePerNight: number;
  nightCount: number;
  roomsCount?: number;
  discountAmount?: number;
  voucherCode?: string;
  taxRate?: number; // e.g. 0.10 for 10%
  className?: string;
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  pricePerNight,
  nightCount,
  roomsCount = 1,
  discountAmount = 0,
  voucherCode,
  taxRate = 0.1,
  className = '',
}) => {
  const subtotal = pricePerNight * nightCount * roomsCount;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * taxRate;
  const total = taxableAmount + taxAmount;

  return (
    <Card className={`price-breakdown ${className}`} padding="md">
      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--spacing-md)' }}>
        Chi tiết giá thanh toán
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            <PriceTag price={pricePerNight} period="" size="sm" /> x {nightCount} đêm x {roomsCount} phòng
          </span>
          <PriceTag price={subtotal} period="" size="sm" />
        </div>

        {discountAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--success)' }}>
            <span>Giảm giá voucher {voucherCode ? `(${voucherCode})` : ''}</span>
            <span>- {new Intl.NumberFormat('vi-VN').format(discountAmount)} ₫</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Thuế & Phí dịch vụ ({Math.round(taxRate * 100)}%)</span>
          <PriceTag price={taxAmount} period="" size="sm" />
        </div>

        <div
          style={{
            borderTop: '1.5px dashed var(--border)',
            paddingTop: 'var(--spacing-md)',
            marginTop: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Tổng số tiền
          </span>
          <PriceTag price={total} period="" size="lg" />
        </div>
      </div>
    </Card>
  );
};
