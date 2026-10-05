import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaPhone, FaCamera } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { normalizeImageUrl } from '../../utils/image';

export const EditProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setIsUploading(true);
    setMessage(null);
    try {
      const res = await apiClient.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        const newAvatar = res.data.data?.avatarUrl || res.data.data?.user?.avatarUrl;
        if (newAvatar) {
          setAvatarUrl(newAvatar);
          await updateUser({ avatarUrl: newAvatar });
          setMessage({ text: 'Tải ảnh đại diện lên thành công!' });
        }
      }
    } catch (err: any) {
      console.error('Upload avatar error:', err);
      setMessage({
        text: err?.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh đại diện lên.',
        isError: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await apiClient.put('/auth/profile', {
        name,
        phone,
        avatarUrl,
      });

      if (res.data?.success) {
        await updateUser({ name, phone, avatarUrl });
        setMessage({ text: 'Cập nhật thông tin thành công!' });
        setTimeout(() => {
          navigate('/profile');
        }, 1200);
      } else {
        setMessage({ text: res.data.message || 'Cập nhật thất bại', isError: true });
      }
    } catch (err: any) {
      setMessage({
        text: err?.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin.',
        isError: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '640px', padding: '40px 0' }}>
      <PageHeader
        title="Chỉnh Sửa Hồ Sơ"
        subtitle="Cập nhật họ tên, số điện thoại và ảnh đại diện"
        showBack
        backUrl="/profile"
      />

      <Card padding="lg">
        {message && (
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              backgroundColor: message.isError ? 'var(--danger-light)' : 'var(--success-light)',
              color: message.isError ? 'var(--danger)' : 'var(--success)',
              fontWeight: 500,
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Avatar Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
            <div
              style={{
                position: 'relative',
                width: '100px',
                height: '100px',
                borderRadius: 'var(--radius-round)',
                overflow: 'hidden',
                backgroundColor: 'var(--primary)',
                color: 'var(--text-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                fontWeight: 700,
                border: '3px solid var(--border)',
              }}
            >
              {avatarUrl ? (
                <img src={normalizeImageUrl(avatarUrl)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{(name || user?.email || 'U')[0].toUpperCase()}</span>
              )}

              {isUploading && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div className="btn-spinner" />
                </div>
              )}
            </div>

            <label
              style={{
                marginTop: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                color: 'var(--secondary)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <FaCamera /> Thay đổi ảnh đại diện
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </label>
          </div>

          <Input
            label="Địa chỉ Email"
            type="email"
            value={user?.email || ''}
            disabled
            helperText="Email tài khoản không thể thay đổi"
          />

          <Input
            label="Họ và tên"
            type="text"
            placeholder="Nhập họ và tên"
            leftIcon={<FaUser />}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Số điện thoại"
            type="tel"
            placeholder="Nhập số điện thoại"
            leftIcon={<FaPhone />}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <Button type="button" variant="outline" fullWidth onClick={() => navigate('/profile')}>
              Hủy
            </Button>
            <Button type="submit" variant="accent" fullWidth isLoading={isSubmitting}>
              Lưu Thay Đổi
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
