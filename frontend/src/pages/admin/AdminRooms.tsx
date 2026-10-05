import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaBed, FaSearch } from 'react-icons/fa';
import { apiClient } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PriceTag } from '../../components/ui/PriceTag';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ConfirmModal } from '../../components/feedback/ConfirmModal';
import { Skeleton } from '../../components/feedback/Skeleton';
import './Admin.css';

export const AdminRooms: React.FC = () => {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/rooms');
      if (res.data?.success) {
        setRooms(res.data.data.rooms || []);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await apiClient.delete(`/rooms/${deleteId}`);
      if (res.data?.success) {
        setDeleteId(null);
        fetchRooms();
      }
    } catch (err) {
      console.error('Error deleting room:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="admin-header-row">
        <div>
          <h1 className="admin-page-title">Quản Lý Phòng Nghỉ</h1>
          <p className="admin-page-subtitle">Xem, thêm mới, cập nhật giá và tình trạng phòng</p>
        </div>

        <Link to="/admin/rooms/add">
          <Button variant="accent" size="md" leftIcon={<FaPlus />}>
            Thêm Phòng Mới
          </Button>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <FaSearch className="admin-search-icon" />
          <input
            type="text"
            placeholder="Tìm theo tên phòng, loại phòng, địa điểm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      {/* Table */}
      <Card padding="none" className="admin-table-card">
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên phòng</th>
                <th>Loại phòng</th>
                <th>Địa điểm</th>
                <th>Giá / Đêm</th>
                <th>Sức chứa</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4].map((n) => (
                  <tr key={n}>
                    <td colSpan={8}>
                      <Skeleton height="36px" />
                    </td>
                  </tr>
                ))
              ) : filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <FaBed size={32} style={{ color: 'var(--text-light)', marginBottom: '8px' }} />
                    <p>Không có phòng nào phù hợp</p>
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => {
                  const thumbnail =
                    room.images && room.images.length > 0
                      ? typeof room.images[0] === 'string'
                        ? room.images[0]
                        : room.images[0].url
                      : '/images/room1.jpg';

                  return (
                    <tr key={room.id}>
                      <td style={{ width: '80px' }}>
                        <img
                          src={thumbnail}
                          alt={room.name}
                          style={{ width: '60px', height: '45px', objectFit: 'cover', borderRadius: '6px' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/room1.jpg';
                          }}
                        />
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        <Link to={`/rooms/${room.id}`} style={{ color: 'var(--primary)' }}>
                          {room.name}
                        </Link>
                      </td>
                      <td>{room.type}</td>
                      <td>{room.location}</td>
                      <td>
                        <PriceTag price={room.pricePerNight} period="" size="sm" />
                      </td>
                      <td>
                        {room.capacityAdults} người lớn{room.capacityChildren ? `, ${room.capacityChildren} trẻ em` : ''}
                      </td>
                      <td>
                        <StatusBadge status={room.status || 'AVAILABLE'} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/rooms/add?editId=${room.id}`)}
                            title="Sửa phòng"
                          >
                            <FaEdit color="var(--secondary)" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(room.id)}
                            title="Xóa phòng"
                          >
                            <FaTrash color="var(--danger)" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa phòng nghỉ"
        message="Bạn có chắc chắn muốn xóa phòng này không? Các dữ liệu hình ảnh liên kết cũng sẽ bị xóa vĩnh viễn."
        confirmText="Xóa phòng"
        isDanger
        isLoading={isDeleting}
      />
    </div>
  );
};
