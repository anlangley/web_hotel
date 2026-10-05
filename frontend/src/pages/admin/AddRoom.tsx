import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCloudUploadAlt, FaTrash, FaCheck } from 'react-icons/fa';
import { apiClient } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/layout/PageHeader';
import './Admin.css';

const ROOM_TYPES = ['Phòng Đơn', 'Phòng Đôi', 'Suite', 'VIP'];
const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Còn phòng (Sẵn sàng)' },
  { value: 'MAINTENANCE', label: 'Bảo trì' },
  { value: 'BOOKED', label: 'Hết phòng' },
];

export const AddRoom: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');

  const [name, setName] = useState('');
  const [type, setType] = useState('Phòng Đơn');
  const [pricePerNight, setPricePerNight] = useState('');
  const [location, setLocation] = useState('Đà Nẵng');
  const [description, setDescription] = useState('');
  const [capacityAdults, setCapacityAdults] = useState('2');
  const [capacityChildren, setCapacityChildren] = useState('0');
  const [quantity, setQuantity] = useState('1');
  const [status, setStatus] = useState('AVAILABLE');
  const [amenities, setAmenities] = useState('Wifi tốc độ cao, Điều hòa, Smart TV, Ăn sáng buffet');

  // Images
  const [images, setImages] = useState<Array<{ url: string; isPrimary: boolean }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editId) {
      fetchRoomDetail(editId);
    }
  }, [editId]);

  const fetchRoomDetail = async (id: string) => {
    try {
      const res = await apiClient.get(`/rooms/${id}`);
      if (res.data?.success) {
        const r = res.data.data.room;
        setName(r.name);
        setType(r.type);
        setPricePerNight(r.pricePerNight.toString());
        setLocation(r.location);
        setDescription(r.description || '');
        setCapacityAdults(r.capacityAdults?.toString() || '2');
        setCapacityChildren(r.capacityChildren?.toString() || '0');
        setQuantity(r.quantity?.toString() || '1');
        setStatus(r.status || 'AVAILABLE');
        setAmenities(r.amenities || '');
        if (r.images && r.images.length > 0) {
          setImages(r.images);
        }
      }
    } catch (err) {
      console.error('Error fetching room detail:', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMsg('');
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('image', files[i]);

        const res = await apiClient.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data?.success && res.data?.data?.url) {
          setImages((prev) => [
            ...prev,
            { url: res.data.data.url, isPrimary: prev.length === 0 },
          ]);
        }
      }
    } catch (err) {
      console.error('Upload image error:', err);
      setErrorMsg('Tải ảnh lên thất bại.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetPrimary = (index: number) => {
    setImages((prev) =>
      prev.map((img, idx) => ({ ...img, isPrimary: idx === index }))
    );
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pricePerNight || !location) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        name,
        type,
        pricePerNight: Number(pricePerNight),
        location,
        description,
        capacityAdults: Number(capacityAdults),
        capacityChildren: Number(capacityChildren),
        quantity: Number(quantity),
        status,
        amenities,
        images: images.length > 0 ? images : [{ url: '/images/room1.jpg', isPrimary: true }],
      };

      if (editId) {
        await apiClient.put(`/rooms/${editId}`, payload);
      } else {
        await apiClient.post('/rooms', payload);
      }

      navigate('/admin/rooms');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu phòng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-page" style={{ maxWidth: '900px' }}>
      <PageHeader
        title={editId ? 'Chỉnh Sửa Phòng Nghỉ' : 'Thêm Phòng Nghỉ Mới'}
        subtitle="Nhập thông tin chi tiết phòng, giá cả và hình ảnh"
        showBack
        backUrl="/admin/rooms"
      />

      {errorMsg && <div className="admin-error-banner">{errorMsg}</div>}

      <form onSubmit={handleSubmit}>
        <Card padding="lg" style={{ marginBottom: '24px' }}>
          <h3 className="card-section-title">Thông tin cơ bản</h3>

          <div className="admin-form-grid">
            <Input
              label="Tên phòng nghỉ *"
              type="text"
              placeholder="VD: Phòng Deluxe Ocean View"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="input-group">
              <label className="input-label">Loại phòng *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="input-field"
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Giá mỗi đêm (VNĐ) *"
              type="number"
              placeholder="VD: 2500000"
              value={pricePerNight}
              onChange={(e) => setPricePerNight(e.target.value)}
              required
            />

            <Input
              label="Địa điểm / Tỉnh thành *"
              type="text"
              placeholder="VD: Đà Nẵng"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />

            <Input
              label="Số người lớn tối đa"
              type="number"
              value={capacityAdults}
              onChange={(e) => setCapacityAdults(e.target.value)}
            />

            <Input
              label="Số trẻ em tối đa"
              type="number"
              value={capacityChildren}
              onChange={(e) => setCapacityChildren(e.target.value)}
            />

            <Input
              label="Số lượng phòng này"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            <div className="input-group">
              <label className="input-label">Tình trạng phòng</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input-field"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group" style={{ marginTop: '16px' }}>
            <label className="input-label">Tiện nghi (phân cách bằng dấu phẩy)</label>
            <input
              type="text"
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              className="input-field"
              placeholder="Wifi, Bể bơi, Điều hòa, Smart TV, Ăn sáng..."
            />
          </div>

          <div className="input-group" style={{ marginTop: '16px' }}>
            <label className="input-label">Mô tả chi tiết phòng</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              placeholder="Mô tả về tầm nhìn, nội thất, dịch vụ đi kèm..."
              style={{ resize: 'vertical' }}
            />
          </div>
        </Card>

        {/* Image Upload Card */}
        <Card padding="lg" style={{ marginBottom: '24px' }}>
          <h3 className="card-section-title">Hình ảnh phòng nghỉ</h3>

          <div className="image-upload-dropzone">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              id="room-img-file"
              style={{ display: 'none' }}
            />
            <label htmlFor="room-img-file" className="upload-dropzone-label">
              <FaCloudUploadAlt size={40} color="var(--accent)" />
              <strong>{isUploading ? 'Đang tải ảnh lên...' : 'Nhấp để chọn tải ảnh lên'}</strong>
              <span>Hỗ trợ định dạng JPG, PNG, WEBP</span>
            </label>
          </div>

          {images.length > 0 && (
            <div className="uploaded-images-grid">
              {images.map((img, idx) => (
                <div key={idx} className={`uploaded-img-box ${img.isPrimary ? 'primary-img' : ''}`}>
                  <img src={img.url} alt={`Preview ${idx}`} />
                  <div className="img-actions-bar">
                    <button
                      type="button"
                      className={`btn-set-primary ${img.isPrimary ? 'active' : ''}`}
                      onClick={() => handleSetPrimary(idx)}
                      title={img.isPrimary ? 'Ảnh chính' : 'Đặt làm ảnh chính'}
                    >
                      <FaCheck /> {img.isPrimary ? 'Ảnh chính' : 'Chọn chính'}
                    </button>
                    <button
                      type="button"
                      className="btn-del-img"
                      onClick={() => handleRemoveImage(idx)}
                      title="Xóa ảnh"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate('/admin/rooms')}>
            Hủy Bỏ
          </Button>
          <Button type="submit" variant="accent" size="lg" isLoading={isSubmitting}>
            {editId ? 'Cập Nhật Phòng' : 'Tạo Phòng Mới'}
          </Button>
        </div>
      </form>
    </div>
  );
};
