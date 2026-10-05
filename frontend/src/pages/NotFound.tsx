import React from 'react';
import { Link } from 'react-router-dom';
import { FaCompass } from 'react-icons/fa';
import { Button } from '../components/ui/Button';

export const NotFound: React.FC = () => {
  return (
    <div
      className="container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 20px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '4rem', color: 'var(--accent)', marginBottom: '16px' }}>
        <FaCompass />
      </div>
      <h1 style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
        404
      </h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '12px 0 8px' }}>
        Trang không tìm thấy
      </h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '24px' }}>
        Địa chỉ bạn yêu cầu không tồn tại hoặc đã được di chuyển sang vị trí khác.
      </p>
      <Link to="/">
        <Button variant="accent" size="lg">
          Trở Về Trang Chủ
        </Button>
      </Link>
    </div>
  );
};
