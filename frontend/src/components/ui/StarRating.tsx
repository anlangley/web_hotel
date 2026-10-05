import React from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  reviewsCount?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  reviewsCount,
  size = 16,
  interactive = false,
  onRatingChange,
  className = '',
}) => {
  return (
    <div
      className={`star-rating-container ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
    >
      <div style={{ display: 'inline-flex', gap: '3px' }}>
        {Array.from({ length: maxStars }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= Math.round(rating);

          return (
            <span
              key={index}
              onClick={() => interactive && onRatingChange?.(starValue)}
              style={{
                cursor: interactive ? 'pointer' : 'default',
                color: isFilled ? 'var(--star)' : 'var(--star-empty)',
                fontSize: `${size}px`,
                display: 'inline-flex',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (interactive) e.currentTarget.style.transform = 'scale(1.2)';
              }}
              onMouseLeave={(e) => {
                if (interactive) e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {isFilled ? <FaStar /> : <FaRegStar />}
            </span>
          );
        })}
      </div>

      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
        {rating.toFixed(1)}
      </span>

      {reviewsCount !== undefined && (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          ({reviewsCount})
        </span>
      )}
    </div>
  );
};
