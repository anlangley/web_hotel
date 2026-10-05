import React from 'react';
import { Badge } from './Badge';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toUpperCase();

  const getStatusConfig = (): { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'gray' } => {
    switch (normalized) {
      case 'CONFIRMED':
      case 'PAID':
        return { label: 'Đã thanh toán / Xác nhận', variant: 'success' };
      case 'AWAITING_PAYMENT':
      case 'UNPAID':
        return { label: 'Chờ thanh toán', variant: 'warning' };
      case 'COMPLETED':
        return { label: 'Đã hoàn thành', variant: 'info' };
      case 'CANCELLED':
        return { label: 'Đã hủy', variant: 'danger' };
      case 'AVAILABLE':
        return { label: 'Còn phòng', variant: 'success' };
      case 'MAINTENANCE':
        return { label: 'Bảo trì', variant: 'warning' };
      case 'BOOKED':
        return { label: 'Hết phòng', variant: 'danger' };
      default:
        return { label: status, variant: 'gray' };
    }
  };

  const { label, variant } = getStatusConfig();

  return (
    <Badge variant={variant} size="sm" className={className}>
      {label}
    </Badge>
  );
};
