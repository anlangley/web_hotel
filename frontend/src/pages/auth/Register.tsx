import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaEye, FaEyeSlash, FaHotel } from 'react-icons/fa';
import { apiClient } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import './Auth.css';

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Tên cần ít nhất 2 ký tự')
      .regex(/^[a-zA-ZÀ-ỹ\s]+$/, 'Tên chỉ được chứa chữ cái và khoảng trắng'),
    email: z.string().min(1, 'Vui lòng nhập Email').email('Email không đúng định dạng'),
    phone: z
      .string()
      .min(10, 'Số điện thoại ít nhất 10 số')
      .regex(/^(0[3|5|7|8|9])[0-9]{8}$/, 'Số điện thoại không hợp lệ (VD: 0912345678)'),
    password: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(/[A-Z]/, 'Cần ít nhất 1 chữ cái viết hoa')
      .regex(/[a-z]/, 'Cần ít nhất 1 chữ cái viết thường')
      .regex(/[0-9]/, 'Cần ít nhất 1 chữ số'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setApiError('');
      const response = await apiClient.post('/auth/register', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (response.data.success) {
        setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển hướng đến trang đăng nhập...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setApiError(response.data.message || 'Đăng ký thất bại');
      }
    } catch (err: any) {
      setApiError(err?.response?.data?.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        <div className="auth-brand-header">
          <Link to="/" className="auth-brand-logo">
            <FaHotel /> LUXSTAY
          </Link>
          <h2 className="auth-title">Tạo tài khoản mới</h2>
          <p className="auth-subtitle">Trở thành thành viên để tích điểm và nhận ưu đãi độc quyền</p>
        </div>

        <Card padding="lg" className="auth-form-card">
          {apiError && <div className="auth-error-banner">{apiError}</div>}
          {successMsg && <div className="auth-success-banner">{successMsg}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <Input
              label="Họ và tên"
              type="text"
              placeholder="Nguyễn Văn A"
              leftIcon={<FaUser />}
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Địa chỉ Email"
              type="email"
              placeholder="example@gmail.com"
              leftIcon={<FaEnvelope />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Số điện thoại"
              type="tel"
              placeholder="0912345678"
              leftIcon={<FaPhone />}
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Input
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ít nhất 8 ký tự, 1 hoa, 1 thường, 1 số"
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
              label="Xác nhận mật khẩu"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu"
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
              Đăng Ký Tài Khoản
            </Button>
          </form>

          <div className="auth-footer-prompt">
            Đã có tài khoản?{' '}
            <Link to="/login" className="auth-switch-link">
              Đăng nhập ngay
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
