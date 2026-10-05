import React from 'react';
import {
  FaWifi,
  FaSwimmingPool,
  FaTv,
  FaParking,
  FaDumbbell,
  FaUtensils,
  FaWater,
  FaSnowflake,
  FaCoffee,
  FaSpa,
  FaBed,
  FaCheck,
} from 'react-icons/fa';

interface AmenityBadgeProps {
  name: string | { label?: string; name?: string; icon?: string };
  className?: string;
}

export const AmenityBadge: React.FC<AmenityBadgeProps> = ({ name, className = '' }) => {
  // Safely extract string label
  const label = typeof name === 'string' ? name : name?.label || name?.name || '';

  const getIcon = (amenityName: string) => {
    const lower = (amenityName || '').toLowerCase();
    if (lower.includes('wifi') || lower.includes('wi-fi')) return <FaWifi />;
    if (lower.includes('hồ bơi') || lower.includes('pool')) return <FaSwimmingPool />;
    if (lower.includes('máy lạnh') || lower.includes('điều hòa') || lower.includes('ac')) return <FaSnowflake />;
    if (lower.includes('tv') || lower.includes('tivi')) return <FaTv />;
    if (lower.includes('giường') || lower.includes('bed')) return <FaBed />;
    if (lower.includes('đỗ xe') || lower.includes('parking')) return <FaParking />;
    if (lower.includes('gym') || lower.includes('thể hình')) return <FaDumbbell />;
    if (lower.includes('ăn sáng') || lower.includes('buffet') || lower.includes('nhà hàng')) return <FaUtensils />;
    if (lower.includes('biển') || lower.includes('ocean')) return <FaWater />;
    if (lower.includes('cà phê') || lower.includes('coffee')) return <FaCoffee />;
    if (lower.includes('spa') || lower.includes('massage')) return <FaSpa />;
    return <FaCheck size={12} />;
  };

  if (!label) return null;

  return (
    <span
      className={`amenity-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: 'var(--radius-round)',
        backgroundColor: '#F3F4F6',
        color: 'var(--text-primary)',
        fontSize: '0.85rem',
        fontWeight: 500,
      }}
    >
      <span style={{ color: 'var(--secondary)' }}>{getIcon(label)}</span>
      <span>{label}</span>
    </span>
  );
};
