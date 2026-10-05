import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaFilter, FaSearch, FaTimes, FaCalendarAlt, FaSortAmountDown } from 'react-icons/fa';
import { apiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { RoomGrid } from '../../components/rooms/RoomGrid';
import type { RoomItem } from '../../components/rooms/RoomCard';
import { Skeleton } from '../../components/feedback/Skeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Button } from '../../components/ui/Button';
import './RoomList.css';

const TYPE_OPTIONS = [
  { value: '', label: 'Tất Cả Hạng Phòng' },
  { value: 'VIP', label: 'Phòng VIP Hoàng Gia' },
  { value: 'SUITE', label: 'Suite Hướng Biển' },
  { value: 'DOUBLE', label: 'Phòng Đôi Executive' },
  { value: 'SINGLE', label: 'Phòng Đơn Deluxe' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất ưu tiên' },
  { value: 'price_asc', label: 'Giá từ thấp đến cao' },
  { value: 'price_desc', label: 'Giá từ cao đến thấp' },
  { value: 'rating_desc', label: 'Đánh giá cao nhất (5 sao)' },
];

export const RoomList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters from URL
  const locationParam = searchParams.get('location') || '';
  const typeParam = searchParams.get('type') || '';
  const checkInParam = searchParams.get('checkIn') || '';
  const checkOutParam = searchParams.get('checkOut') || '';
  const sortParam = searchParams.get('sortBy') || 'newest';

  // Local filter states
  const [searchQuery, setSearchQuery] = useState(locationParam);
  const [selectedType, setSelectedType] = useState(typeParam);
  const [selectedSort, setSelectedSort] = useState(sortParam);
  const [checkIn, setCheckIn] = useState(checkInParam);
  const [checkOut, setCheckOut] = useState(checkOutParam);

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string> = {};
        if (locationParam) params.location = locationParam;
        if (typeParam) params.type = typeParam;
        if (checkInParam) params.checkIn = checkInParam;
        if (checkOutParam) params.checkOut = checkOutParam;
        if (sortParam) params.sortBy = sortParam;

        const res = await apiClient.get('/rooms', { params });
        if (res.data?.success) {
          let roomData: RoomItem[] = res.data.data.rooms || [];

          // Sort client-side
          if (sortParam === 'price_asc') {
            roomData = [...roomData].sort((a, b) => Number(a.pricePerNight) - Number(b.pricePerNight));
          } else if (sortParam === 'price_desc') {
            roomData = [...roomData].sort((a, b) => Number(b.pricePerNight) - Number(a.pricePerNight));
          } else if (sortParam === 'rating_desc') {
            roomData = [...roomData].sort((a, b) => (Number(b.avgRating) || 0) - (Number(a.avgRating) || 0));
          }

          setRooms(roomData);
        }
      } catch (err) {
        console.error('Error fetching rooms:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, [locationParam, typeParam, checkInParam, checkOutParam, sortParam]);

  // Fetch favorites
  useEffect(() => {
    if (!user) return;
    const fetchFavorites = async () => {
      try {
        const res = await apiClient.get('/favorites');
        if (res.data?.success) {
          const raw = res.data.data;
          const list = Array.isArray(raw) ? raw : (raw?.favorites || []);
          const ids = list.map((fav: any) => fav.roomId || fav.room?.id);
          setFavoriteIds(ids);
        }
      } catch (err) {
        console.error('Error fetching favorites:', err);
      }
    };
    fetchFavorites();
  }, [user]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams();
    if (searchQuery) newParams.set('location', searchQuery);
    if (selectedType) newParams.set('type', selectedType);
    if (checkIn) newParams.set('checkIn', checkIn);
    if (checkOut) newParams.set('checkOut', checkOut);
    if (selectedSort) newParams.set('sortBy', selectedSort);
    setSearchParams(newParams);
  };

  const handleResetFilter = () => {
    setSearchQuery('');
    setSelectedType('');
    setSelectedSort('newest');
    setCheckIn('');
    setCheckOut('');
    setSearchParams(new URLSearchParams());
  };

  const handleToggleFavorite = async (roomId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await apiClient.post(`/favorites/toggle/${roomId}`);
      if (res.data?.success) {
        setFavoriteIds((prev) =>
          prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
        );
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  return (
    <div className="room-list-page">
      {/* ── LUXURY PAGE BANNER ── */}
      <section className="room-list-hero">
        <div className="container room-list-hero-content">
          <span className="room-list-tag">BỘ SƯU TẬP 5 SAO QUỐC TẾ</span>
          <h1 className="room-list-title">Danh Sách Phòng Nghỉ & Biệt Thự</h1>
          <p className="room-list-subtitle">
            Khám phá không gian nghỉ dưỡng thượng lưu được thiết kế tinh tế với tầm nhìn triệu đô bên bờ đại dương.
          </p>
        </div>
      </section>

      <div className="container">
        {/* ── FILTER TOOLBAR CONSOLE ── */}
        <div className="luxury-filter-console">
          <form onSubmit={handleApplyFilter} className="filter-form-inner">
            {/* Keyword / Location */}
            <div className="console-input-wrap">
              <FaSearch className="console-icon" />
              <input
                type="text"
                placeholder="Tìm theo tên phòng, địa điểm nghỉ dưỡng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="console-text-input"
              />
            </div>

            {/* Room Type */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="console-select"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Check In */}
            <div className="console-date-wrap">
              <FaCalendarAlt className="date-icon" />
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="console-date-input"
                title="Ngày nhận phòng"
              />
            </div>

            {/* Check Out */}
            <div className="console-date-wrap">
              <FaCalendarAlt className="date-icon" />
              <input
                type="date"
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
                className="console-date-input"
                title="Ngày trả phòng"
              />
            </div>

            {/* Sort */}
            <div className="console-sort-wrap">
              <FaSortAmountDown className="sort-icon" />
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="console-select"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="console-actions">
              <Button type="submit" variant="accent" size="md">
                Áp Dụng
              </Button>

              {(locationParam || typeParam || checkInParam || checkOutParam || sortParam !== 'newest') && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleResetFilter}
                  leftIcon={<FaTimes />}
                >
                  Xóa lọc
                </Button>
              )}
            </div>
          </form>

          {/* Quick Counter Strip */}
          <div className="filter-summary-row">
            <span className="results-count-badge">
              Tìm thấy <strong>{rooms.length}</strong> phòng nghỉ khả dụng
            </span>
          </div>
        </div>

        {/* ── ROOMS CONTENT ── */}
        {isLoading ? (
          <div className="room-grid" style={{ paddingBottom: '60px' }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} style={{ background: '#fff', borderRadius: '18px', overflow: 'hidden', padding: '16px' }}>
                <Skeleton height="220px" borderRadius="14px" />
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Skeleton width="45%" height="16px" />
                  <Skeleton width="85%" height="24px" />
                  <Skeleton width="60%" height="16px" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div style={{ padding: '60px 0' }}>
            <EmptyState
              icon={<FaFilter />}
              title="Không tìm thấy phòng phù hợp với tiêu chí"
              description="Rất tiếc, hiện tại không có phòng nào thỏa mãn các điều kiện tìm kiếm trên. Quý khách vui lòng thử thay đổi ngày hoặc chọn tất cả loại phòng."
              actionText="Xem tất cả phòng có sẵn"
              onAction={handleResetFilter}
            />
          </div>
        ) : (
          <div style={{ paddingBottom: '80px' }}>
            <RoomGrid
              rooms={rooms}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        )}
      </div>
    </div>
  );
};
