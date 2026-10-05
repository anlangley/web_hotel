import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StarRating } from '../ui/StarRating';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  initialReview?: { rating?: number; comment?: string };
  onSubmit: (rating: number, comment: string, isEdit: boolean) => Promise<boolean>;
  onDelete?: () => Promise<boolean>;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  initialReview,
  onSubmit,
  onDelete,
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialReview) {
        setRating(initialReview.rating || 5);
        setComment(initialReview.comment || '');
      } else {
        setRating(5);
        setComment('');
      }
      setError('');
    }
  }, [isOpen, initialReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim().length < 10) {
      setError('Nhận xét cần ít nhất 10 ký tự.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const success = await onSubmit(rating, comment, !!initialReview);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này không?')) return;
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      const success = await onDelete();
      if (success) onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi xóa đánh giá.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialReview ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá trải nghiệm'}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
            Bạn cảm thấy phòng này như thế nào?
          </p>
          <StarRating
            rating={rating}
            size={32}
            interactive
            onRatingChange={(r) => setRating(r)}
          />
        </div>

        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
            Nội dung nhận xét:
          </label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ chi tiết trải nghiệm của bạn (tiện nghi, dịch vụ, độ sạch sẽ...)"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: error ? '1.5px solid var(--danger)' : '1.5px solid var(--border)',
              outline: 'none',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '4px' }}>
              {error}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {initialReview && onDelete ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Xóa đánh giá
            </Button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Đóng
            </Button>
            <Button type="submit" variant="accent" isLoading={isSubmitting}>
              {initialReview ? 'Lưu thay đổi' : 'Gửi đánh giá'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
