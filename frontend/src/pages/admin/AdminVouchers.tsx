import React, { useEffect, useState } from 'react';
import { FaTicketAlt, FaPlus, FaTrash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { apiClient } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/feedback/ConfirmModal';
import { Skeleton } from '../../components/feedback/Skeleton';
import './Admin.css';

export const AdminVouchers: React.FC = () => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Delete Modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/vouchers');
      if (res.data?.success) {
        const raw = res.data.data;
        const list = Array.isArray(raw) ? raw : (raw?.vouchers || []);
        setVouchers(list);
      }
    } catch (err) {
      console.error('Error fetching vouchers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discount) {
      setCreateError('Vui lòng nhập đầy đủ mã và tỷ lệ giảm giá.');
      return;
    }

    setIsSubmitting(true);
    const numDiscount = Number(discount);
    const discountFraction = numDiscount > 1 ? numDiscount / 100 : numDiscount;
    try {
      const res = await apiClient.post('/vouchers', {
        code: code.trim().toUpperCase(),
        discount: discountFraction,
        startDate,
        endDate,
        isActive: true,
      });

      if (res.data?.success) {
        setIsCreateOpen(false);
        setCode('');
        setDiscount('');
        fetchVouchers();
      } else {
        setCreateError(res.data.message || 'Tạo voucher thất bại.');
      }
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || 'Có lỗi xảy ra khi tạo mã giảm giá.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await apiClient.delete(`/vouchers/${deleteId}`);
      if (res.data?.success) {
        setDeleteId(null);
        fetchVouchers();
      }
    } catch (err) {
      console.error('Error deleting voucher:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header-row">
        <div>
          <h1 className="admin-page-title">Mã Giảm Giá & Khuyến Mãi</h1>
          <p className="admin-page-subtitle">Tạo và quản lý các voucher giảm giá cho khách hàng</p>
        </div>

        <Button variant="accent" size="md" leftIcon={<FaPlus />} onClick={() => setIsCreateOpen(true)}>
          Tạo Mã Giảm Giá Mới
        </Button>
      </div>

      <Card padding="none" className="admin-table-card">
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Voucher</th>
                <th>Tỷ lệ giảm</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3].map((n) => (
                  <tr key={n}>
                    <td colSpan={6}>
                      <Skeleton height="36px" />
                    </td>
                  </tr>
                ))
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <FaTicketAlt size={32} style={{ color: 'var(--text-light)', marginBottom: '8px' }} />
                    <p>Chưa có mã giảm giá nào</p>
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '1.05rem', color: 'var(--primary)' }}>
                      {v.code}
                    </td>
                    <td>
                      <Badge variant="accent" size="sm">
                        -{Number(v.discount) <= 1 ? Math.round(Number(v.discount) * 100) : Number(v.discount)}%
                      </Badge>
                    </td>
                    <td>{new Date(v.startDate).toLocaleDateString('vi-VN')}</td>
                    <td>{new Date(v.endDate).toLocaleDateString('vi-VN')}</td>
                    <td>
                      {v.isActive ? (
                        <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.85rem' }}>
                          <FaCheckCircle /> Đang hoạt động
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                          <FaTimesCircle /> Hết hạn / Tắt
                        </span>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(v.id)}
                        title="Xóa voucher"
                      >
                        <FaTrash color="var(--danger)" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Voucher Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Tạo Mã Giảm Giá Mới" maxWidth="480px">
        {createError && (
          <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.85rem' }}>
            {createError}
          </div>
        )}

        <form onSubmit={handleCreateVoucher} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Mã Voucher (viết hoa không dấu) *"
            placeholder="VD: LUXSTAY15"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
          />

          <Input
            label="Phần trăm giảm giá (%) *"
            type="number"
            placeholder="VD: 15"
            min="1"
            max="100"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Ngày bắt đầu"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="Ngày kết thúc"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="accent" isLoading={isSubmitting}>
              Tạo Voucher
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa mã giảm giá"
        message="Bạn có chắc chắn muốn xóa mã voucher này không? Khách hàng sẽ không thể sử dụng mã này được nữa."
        confirmText="Xóa voucher"
        isDanger
        isLoading={isDeleting}
      />
    </div>
  );
};
