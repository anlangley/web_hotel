import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backUrl?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  backUrl,
  actions,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className={`page-header ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-xl) 0',
        marginBottom: 'var(--spacing-lg)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-round)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            aria-label="Quay lại"
          >
            <FaArrowLeft size={16} />
          </button>
        )}
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.2 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && <div>{actions}</div>}
    </div>
  );
};
