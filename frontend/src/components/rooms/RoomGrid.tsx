import React from 'react';
import { RoomCard } from './RoomCard';
import type { RoomItem } from './RoomCard';
import './RoomGrid.css';

interface RoomGridProps {
  rooms: RoomItem[];
  favoriteIds?: string[];
  onToggleFavorite?: (roomId: string) => void;
  className?: string;
  columns?: 2 | 3 | 4;
}

export const RoomGrid: React.FC<RoomGridProps> = ({
  rooms,
  favoriteIds = [],
  onToggleFavorite,
  className = '',
  columns = 3,
}) => {
  return (
    <div className={`room-grid columns-${columns} ${className}`}>
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          isFavorite={favoriteIds.includes(room.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
};
