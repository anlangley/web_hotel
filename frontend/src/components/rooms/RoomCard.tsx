import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaMapMarkerAlt, FaUsers, FaArrowRight } from 'react-icons/fa';
import { Card } from '../ui/Card';
import { PriceTag } from '../ui/PriceTag';
import { StarRating } from '../ui/StarRating';
import { Badge } from '../ui/Badge';
import { normalizeImageUrl } from '../../utils/image';
import './RoomCard.css';

export interface RoomItem {
  id: string;
  name: string;
  type: string;
  pricePerNight: number | string;
  location: string;
  avgRating?: number;
  reviewCount?: number;
  capacityAdults?: number;
  capacityChildren?: number;
  status?: string;
  images?: Array<{ url: string; isPrimary?: boolean }> | string[];
  imageUrl?: string;
  badge?: string | null;
}

interface RoomCardProps {
  room: RoomItem;
  isFavorite?: boolean;
  onToggleFavorite?: (roomId: string) => void;
  className?: string;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  isFavorite = false,
  onToggleFavorite,
  className = '',
}) => {
  // Resolve thumbnail
  const getThumbnail = (): string => {
    if (room.imageUrl) return normalizeImageUrl(room.imageUrl);
    if (room.images && room.images.length > 0) {
      const first = room.images[0];
      if (typeof first === 'string') return normalizeImageUrl(first);
      const primary = (room.images as Array<{ url: string; isPrimary?: boolean }>).find(
        (img) => img.isPrimary
      );
      return normalizeImageUrl(primary ? primary.url : first.url);
    }
    return '/images/room1.jpg';
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(room.id);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SINGLE': return 'Phòng Đơn Delux';
      case 'DOUBLE': return 'Phòng Đôi Executive';
      case 'SUITE': return 'Phòng Suite Hướng Biển';
      case 'VIP': return 'Phòng VIP Hoàng Gia';
      default: return type;
    }
  };

  return (
    <Card hoverable padding="none" className={`luxury-room-card ${className}`}>
      <Link to={`/rooms/${room.id}`} className="room-card-link">
        {/* Image Showcase */}
        <div className="room-card-img-wrapper">
          <img
            src={getThumbnail()}
            alt={room.name}
            className="room-card-img"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/room1.jpg';
            }}
          />

          <div className="room-card-img-overlay" />

          {room.badge ? (
            <Badge variant="accent" size="sm" className="room-card-badge">
              {room.badge}
            </Badge>
          ) : (
            <span className="room-type-pill">{getTypeLabel(room.type)}</span>
          )}

          {onToggleFavorite && (
            <button
              type="button"
              className={`room-favorite-btn ${isFavorite ? 'active' : ''}`}
              onClick={handleFavoriteClick}
              aria-label="Yêu thích phòng"
            >
              {isFavorite ? <FaHeart color="#EF4444" /> : <FaRegHeart />}
            </button>
          )}
        </div>

        {/* Content Details */}
        <div className="room-card-content">
          <div className="room-card-top-meta">
            <div className="room-card-location">
              <FaMapMarkerAlt className="location-icon" />
              <span>{room.location}</span>
            </div>
            <StarRating
              rating={Number(room.avgRating) || 5.0}
              reviewsCount={room.reviewCount}
              size={13}
            />
          </div>

          <h3 className="room-card-title">{room.name}</h3>

          <div className="room-card-specs">
            <span className="spec-item">
              <FaUsers className="spec-icon" /> {room.capacityAdults || 2} Khách
            </span>
            <span className="spec-dot">•</span>
            <span className="spec-item">Bữa sáng miễn phí</span>
            <span className="spec-dot">•</span>
            <span className="spec-item">Wifi tốc độ cao</span>
          </div>

          <div className="room-card-footer">
            <div className="price-box">
              <span className="price-label">Giá chỉ từ</span>
              <PriceTag price={room.pricePerNight} size="md" />
            </div>
            <span className="room-view-btn">
              Khám phá <FaArrowRight className="arrow-icon" />
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
};
