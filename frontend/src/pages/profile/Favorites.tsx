import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart } from 'react-icons/fa';
import { apiClient } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { RoomGrid } from '../../components/rooms/RoomGrid';
import type { RoomItem } from '../../components/rooms/RoomCard';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Skeleton } from '../../components/feedback/Skeleton';

export const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const [favoriteRooms, setFavoriteRooms] = useState<RoomItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/favorites');
      if (res.data?.success) {
        const raw = res.data.data;
        const list = Array.isArray(raw) ? raw : (raw?.favorites || []);
        const rooms = list.map((item: any) => item.room || item);
        const ids = rooms.map((r: any) => r.id);
        setFavoriteRooms(rooms);
        setFavoriteIds(ids);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async (roomId: string) => {
    try {
      const res = await apiClient.post(`/favorites/toggle/${roomId}`);
      if (res.data?.success) {
        setFavoriteRooms((prev) => prev.filter((r) => r.id !== roomId));
        setFavoriteIds((prev) => prev.filter((id) => id !== roomId));
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  return (
    <div className="container" style={{ padding: '30px 20px 60px' }}>
      <PageHeader
        title="Phòng Nghỉ Yêu Thích"
        subtitle={`Bạn đã lưu ${favoriteRooms.length} phòng vào danh sách quan tâm`}
        showBack
        backUrl="/profile"
      />

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} height="280px" borderRadius="16px" />
          ))}
        </div>
      ) : favoriteRooms.length === 0 ? (
        <EmptyState
          icon={<FaHeart />}
          title="Chưa có phòng yêu thích nào"
          description="Khám phá ngay bộ sưu tập phòng nghỉ sang trọng của chúng tôi và bấm vào biểu tượng trái tim để lưu lại những căn phòng bạn yêu thích nhất."
          actionText="Khám phá phòng ngay"
          onAction={() => navigate('/rooms')}
        />
      ) : (
        <RoomGrid
          rooms={favoriteRooms}
          favoriteIds={favoriteIds}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </div>
  );
};
