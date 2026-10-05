import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FaKey, FaLock, FaEye, FaEyeSlash, FaHotel } from 'react-icons/fa';
import { apiClient } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import './Auth.css';

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Vui lòng nhập mã xác thực từ email'),
    password: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
      .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
      .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 chữ số'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      setApiError('');
      const response = await apiClient.post('/auth/reset-password', {
        token: data.token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      setApiError(err?.response?.data?.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        <div className="auth-brand-header">
          <Link to="/" className="auth-brand-logo">
            <FaHotel /> LUXSTAY
          </Link>
          <h2 className="auth-title">Đặt lại mật khẩu</h2>
          <p className="auth-subtitle">
            {emailParam ? `Nhập mã xác thực đã gửi tới ${emailParam}` : 'Nhập mã xác thực và mật khẩu mới'}
          </p>
        </div>

        <Card padding="lg" className="auth-form-card">
          {apiError && <div className="auth-error-banner">{apiError}</div>}
          {success && (
            <div className="auth-success-banner">
              Đặt lại mật khẩu thành công! Đang chuyển hướng tới trang đăng nhập...
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <Input
              label="Mã xác thực (Token)"
              type="text"
              placeholder="Nhập mã từ email"
              leftIcon={<FaKey />}
              error={errors.token?.message}
              {...register('token')}
            />

            <Input
              label="Mật khẩu mới"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ít nhất 8 ký tự (hoa, thường, số)"
              leftIcon={<FaLock />}
              rightIcon={
                <span onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              }
              error={errors.password?.message}
              {...register('password')}
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

            <Button
              type="submit"
              variant="accent"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              style={{ marginTop: '10px' }}
            >
              Lưu mật khẩu mới
            </Button>
          </form>

          <div className="auth-footer-prompt">
            <Link to="/login" className="auth-switch-link">
              Quay lại đăng nhập
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
