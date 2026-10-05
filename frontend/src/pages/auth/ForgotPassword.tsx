import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FaEnvelope, FaHotel, FaArrowLeft } from 'react-icons/fa';
import { apiClient } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import './Auth.css';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập Email').email('Email không đúng định dạng'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setApiError('');
      const response = await apiClient.post('/auth/forgot-password', {
        email: data.email,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(data.email)}`);
        }, 2000);
      }
    } catch (err: any) {
      setApiError(err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        <div className="auth-brand-header">
          <Link to="/" className="auth-brand-logo">
            <FaHotel /> LUXSTAY
          </Link>
          <h2 className="auth-title">Quên mật khẩu</h2>
          <p className="auth-subtitle">Nhập email để nhận mã xác nhận và hướng dẫn đặt lại mật khẩu</p>
        </div>

        <Card padding="lg" className="auth-form-card">
          {apiError && <div className="auth-error-banner">{apiError}</div>}
          {success && (
            <div className="auth-success-banner">
              Đã gửi yêu cầu thành công! Vui lòng kiểm tra hộp thư email của bạn. Đang chuyển hướng...
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <Input
              label="Địa chỉ Email của bạn"
              type="email"
              placeholder="example@gmail.com"
              leftIcon={<FaEnvelope />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Button
              type="submit"
              variant="accent"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              style={{ marginTop: '10px' }}
            >
              Gửi yêu cầu đặt lại
            </Button>
          </form>

          <div className="auth-footer-prompt">
            <Link to="/login" className="auth-switch-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FaArrowLeft size={12} /> Quay lại đăng nhập
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
