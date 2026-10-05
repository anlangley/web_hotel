import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaCompass } from 'react-icons/fa';
import { Button } from '../ui/Button';
import './SearchBar.css';

interface SearchBarProps {
  initialLocation?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  onSearch?: (params: { location: string; checkIn: string; checkOut: string; guests: number }) => void;
  compact?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialLocation = '',
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = 2,
  onSearch,
  compact = false,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'resort' | 'hotel' | 'villa'>('resort');
  const [location, setLocation] = useState(initialLocation);

  // Default dates: tomorrow and 2 days later if empty
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(initialCheckIn || formatDate(tomorrow));
  const [checkOut, setCheckOut] = useState(initialCheckOut || formatDate(dayAfter));
  const [guests, setGuests] = useState(initialGuests);

  // Calculate nights
  const calculateNights = () => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    return Math.max(1, Math.round(diff));
  };

  const nights = calculateNights();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({ location, checkIn, checkOut, guests });
    } else {
      const searchParams = new URLSearchParams();
      if (location) searchParams.set('location', location);
      if (checkIn) searchParams.set('checkIn', checkIn);
      if (checkOut) searchParams.set('checkOut', checkOut);
      if (guests) searchParams.set('guests', guests.toString());
      navigate(`/rooms?${searchParams.toString()}`);
    }
  };

  return (
    <div className={`search-console-wrapper ${compact ? 'compact' : ''}`}>
      {!compact && (
        <div className="search-tab-bar">
          <button
            type="button"
            className={`search-tab-btn ${activeTab === 'resort' ? 'active' : ''}`}
            onClick={() => setActiveTab('resort')}
          >
            <FaCompass /> Nghỉ Dưỡng & Resort
          </button>
          <button
            type="button"
            className={`search-tab-btn ${activeTab === 'hotel' ? 'active' : ''}`}
            onClick={() => setActiveTab('hotel')}
          >
            Khách Sạn 5 Sao
          </button>
          <button
            type="button"
            className={`search-tab-btn ${activeTab === 'villa' ? 'active' : ''}`}
            onClick={() => setActiveTab('villa')}
          >
            Biệt Thự & Villa
          </button>
        </div>
      )}

      <form className="search-console-card" onSubmit={handleSubmit}>
        {/* Destination */}
        <div className="search-console-field">
          <label className="search-field-label">
            <FaMapMarkerAlt className="field-icon" /> Điểm Đến Nghỉ Dưỡng
          </label>
          <input
            type="text"
            placeholder="Đà Nẵng, Nha Trang, Phú Quốc..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="search-console-input"
          />
        </div>

        <div className="search-field-divider" />

        {/* Check In */}
        <div className="search-console-field">
          <label className="search-field-label">
            <FaCalendarAlt className="field-icon" /> Nhận Phòng
          </label>
          <input
            type="date"
            value={checkIn}
            min={formatDate(today)}
            onChange={(e) => setCheckIn(e.target.value)}
            className="search-console-input date-input"
          />
        </div>

        <div className="search-field-divider" />

        {/* Check Out & Nights Indicator */}
        <div className="search-console-field">
          <div className="label-with-nights">
            <label className="search-field-label">
              <FaCalendarAlt className="field-icon" /> Trả Phòng
            </label>
            <span className="nights-badge">{nights} đêm</span>
          </div>
          <input
            type="date"
            value={checkOut}
            min={checkIn || formatDate(tomorrow)}
            onChange={(e) => setCheckOut(e.target.value)}
            className="search-console-input date-input"
          />
        </div>

        <div className="search-field-divider" />

        {/* Guests */}
        <div className="search-console-field">
          <label className="search-field-label">
            <FaUsers className="field-icon" /> Số Lượng Khách
          </label>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="search-console-input select-input"
          >
            <option value={1}>1 Người lớn</option>
            <option value={2}>2 Người lớn (1 Phòng)</option>
            <option value={3}>3 Người lớn</option>
            <option value={4}>4 Người lớn (Gia đình)</option>
            <option value={5}>5+ Khách (Nhóm bạn)</option>
          </select>
        </div>

        {/* Action Button */}
        <div className="search-console-action">
          <Button variant="accent" size="lg" type="submit" leftIcon={<FaSearch />}>
            <span>Tìm Phòng</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
