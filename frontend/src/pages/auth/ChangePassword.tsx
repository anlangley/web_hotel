import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { apiClient } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/layout/PageHeader';

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z
      .string()
      .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
      .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
      .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
      .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 chữ số'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ChangePasswordForm) => {
    try {
      setApiError('');
      const response = await apiClient.post('/auth/change-password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      if (response.data.success) {
        setSuccess(true);
        reset();
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
      }
    } catch (err: any) {
      setApiError(err?.response?.data?.message || 'Mật khẩu hiện tại không chính xác.');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '40px auto' }}>
      <PageHeader
        title="Đổi mật khẩu"
        subtitle="Cập nhật mật khẩu để bảo vệ tài khoản của bạn"
        showBack
        backUrl="/profile"
      />

      <Card padding="lg">
        {apiError && (
          <div
            style={{
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            {apiError}
          </div>
        )}

        {success && (
          <div
            style={{
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            Mật khẩu đã được thay đổi thành công! Đang quay lại trang hồ sơ...
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <Input
            label="Mật khẩu hiện tại"
            type={showOld ? 'text' : 'password'}
            placeholder="Nhập mật khẩu hiện tại"
            leftIcon={<FaLock />}
            rightIcon={
              <span onClick={() => setShowOld(!showOld)} style={{ cursor: 'pointer' }}>
                {showOld ? <FaEyeSlash /> : <FaEye />}
              </span>
            }
            error={errors.oldPassword?.message}
            {...register('oldPassword')}
          />

          <Input
            label="Mật khẩu mới"
            type={showNew ? 'text' : 'password'}
            placeholder="Ít nhất 8 ký tự (hoa, thường, số)"
            leftIcon={<FaLock />}
            rightIcon={
              <span onClick={() => setShowNew(!showNew)} style={{ cursor: 'pointer' }}>
                {showNew ? <FaEyeSlash /> : <FaEye />}
              </span>
            }
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />

          <Input
            label="Xác nhận mật khẩu mới"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu mới"
            leftIcon={<FaLock />}
            rightIcon={
              <span onClick={() => setShowConfirm(!showConfirm)} style={{ cursor: 'pointer' }}>
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </span>
            }
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button type="submit" variant="accent" size="lg" isLoading={isSubmitting}>
            Cập nhật mật khẩu
          </Button>
        </form>
      </Card>
    </div>
  );
};
