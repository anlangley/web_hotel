import React from 'react';

interface PriceTagProps {
  price: number | string;
  period?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PriceTag: React.FC<PriceTagProps> = ({
  price,
  period = '/ đêm',
  size = 'md',
  className = '',
}) => {
  // Format price VND (e.g., 2500000 -> 2.500.000)
  const num = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.-]+/g, '')) || 0 : price;
  const formatted = new Intl.NumberFormat('vi-VN').format(num);

  const sizeStyles: Record<string, { fontSize: string; unitSize: string }> = {
    sm: { fontSize: '1rem', unitSize: '0.8rem' },
    md: { fontSize: '1.25rem', unitSize: '0.875rem' },
    lg: { fontSize: '1.5rem', unitSize: '0.95rem' },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      className={`price-tag ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        fontWeight: 700,
        color: 'var(--primary)',
        gap: '4px',
      }}
    >
      <span style={{ fontSize: currentSize.fontSize, color: 'var(--primary)', letterSpacing: '-0.3px' }}>
        {formatted} ₫
      </span>
      {period && (
        <span style={{ fontSize: currentSize.unitSize, color: 'var(--text-secondary)', fontWeight: 400 }}>
          {period}
        </span>
      )}
    </span>
  );
};
