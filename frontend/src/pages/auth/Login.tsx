import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaHotel } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import './Auth.css';

const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập Email').email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải lớn hơn 6 ký tự'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setApiError('');
      const response = await apiClient.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      const result = response.data;
      if (result.success) {
        await login(result.data.token, {
          id: result.data.user.id,
          email: result.data.user.email,
          role: result.data.user.role,
          name: result.data.user.name,
          phone: result.data.user.phone,
          avatarUrl: result.data.user.avatarUrl,
        });

        if (result.data.user.role === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setApiError(result.message || 'Đăng nhập không thành công');
      }
    } catch (err: any) {
      setApiError(
        err?.response?.data?.message || 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.'
      );
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        <div className="auth-brand-header">
          <Link to="/" className="auth-brand-logo">
            <FaHotel /> LUXSTAY
          </Link>
          <h2 className="auth-title">Chào mừng trở lại</h2>
          <p className="auth-subtitle">Đăng nhập để quản lý đặt phòng và nhận ưu đãi độc quyền</p>
        </div>

        <Card padding="lg" className="auth-form-card">
          {apiError && <div className="auth-error-banner">{apiError}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <Input
              label="Địa chỉ Email"
              type="email"
              placeholder="example@gmail.com"
              leftIcon={<FaEnvelope />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div style={{ position: 'relative' }}>
              <Input
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu của bạn"
                leftIcon={<FaLock />}
                rightIcon={
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ cursor: 'pointer' }}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                }
                error={errors.password?.message}
                {...register('password')}
              />
              <div style={{ textAlign: 'right', marginTop: '6px' }}>
                <Link to="/forgot-password" style={{ fontSize: '0.825rem', color: 'var(--accent-dark)', fontWeight: 600 }}>
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="accent"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              style={{ marginTop: '10px' }}
            >
              Đăng Nhập
            </Button>
          </form>

          <div className="auth-footer-prompt">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="auth-switch-link">
              Đăng ký ngay
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
