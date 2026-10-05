import React, { useEffect, useState } from 'react';
import { FaUsers, FaSearch, FaUserShield, FaUser } from 'react-icons/fa';
import { apiClient } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/feedback/Skeleton';
import './Admin.css';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/users');
      if (res.data?.success) {
        setUsers(res.data.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const res = await apiClient.patch(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data?.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể cập nhật quyền người dùng');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const nameMatch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch = !roleFilter || u.role === roleFilter;
    return (nameMatch || emailMatch) && roleMatch;
  });

  return (
    <div className="admin-page">
      <div className="admin-header-row">
        <div>
          <h1 className="admin-page-title">Quản Lý Người Dùng</h1>
          <p className="admin-page-subtitle">Danh sách tài khoản khách hàng và phân quyền hệ thống</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <FaSearch className="admin-search-icon" />
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="admin-select"
        >
          <option value="">Tất cả vai trò</option>
          <option value="USER">Khách hàng (USER)</option>
          <option value="ADMIN">Quản trị viên (ADMIN)</option>
        </select>
      </div>

      <Card padding="none" className="admin-table-card">
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Số lượt đặt phòng</th>
                <th>Ngày tham gia</th>
                <th>Vai trò</th>
                <th>Đổi vai trò</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4].map((n) => (
                  <tr key={n}>
                    <td colSpan={7}>
                      <Skeleton height="36px" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <FaUsers size={32} style={{ color: 'var(--text-light)', marginBottom: '8px' }} />
                    <p>Không tìm thấy người dùng phù hợp</p>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="admin-user-avatar">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} />
                          ) : (
                            <span>{(user.name || user.email)[0].toUpperCase()}</span>
                          )}
                        </div>
                        <span style={{ fontWeight: 600 }}>{user.name || 'Chưa đặt tên'}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone || '—'}</td>
                    <td style={{ fontWeight: 600, textAlign: 'center' }}>
                      {user._count?.bookings || 0}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <Badge variant={user.role === 'ADMIN' ? 'accent' : 'primary'} size="sm">
                        {user.role === 'ADMIN' ? <><FaUserShield /> ADMIN</> : <><FaUser /> USER</>}
                      </Badge>
                    </td>
                    <td>
                      <select
                        value={user.role}
                        disabled={updatingId === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="admin-status-dropdown"
                      >
                        <option value="USER">USER (Khách hàng)</option>
                        <option value="ADMIN">ADMIN (Quản trị)</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
