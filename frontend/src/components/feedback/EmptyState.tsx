import React from 'react';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`empty-state ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-huge) var(--spacing-xl)',
        textAlign: 'center',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px dashed var(--border)',
        margin: 'var(--spacing-xl) 0',
      }}
    >
      {icon && (
        <div
          style={{
            fontSize: '3rem',
            color: 'var(--accent)',
            marginBottom: 'var(--spacing-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(212, 168, 83, 0.1)',
            width: '80px',
            height: '80px',
            borderRadius: 'var(--radius-round)',
          }}
        >
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
        {title}
      </h3>
      {description && (
        <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: 'var(--spacing-lg)' }}>
          {description}
        </p>
      )}
      {actionText && onAction && (
        <Button variant="accent" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
