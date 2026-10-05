import React, { useEffect, useState } from 'react';
import { FaBell, FaCheckDouble, FaCalendarCheck, FaInfoCircle, FaTicketAlt } from 'react-icons/fa';
import { apiClient } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Skeleton } from '../../components/feedback/Skeleton';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error mark read all:', err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error('Error mark read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'BOOKING':
        return <FaCalendarCheck color="var(--primary)" size={20} />;
      case 'PROMOTION':
        return <FaTicketAlt color="var(--accent)" size={20} />;
      default:
        return <FaInfoCircle color="var(--secondary)" size={20} />;
    }
  };

  return (
    <div className="container" style={{ maxWidth: '780px', padding: '30px 20px 60px' }}>
      <PageHeader
        title="Trung Tâm Thông Báo"
        subtitle="Cập nhật trạng thái đặt phòng và các chương trình ưu đãi"
        showBack
        backUrl="/profile"
        actions={
          notifications.some((n) => !n.isRead) ? (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} leftIcon={<FaCheckDouble />}>
              Đánh dấu đã đọc tất cả
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} height="80px" borderRadius="12px" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<FaBell />}
          title="Không có thông báo mới"
          description="Bạn đã cập nhật hết tất cả thông báo gần đây."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((item) => (
            <Card
              key={item.id}
              padding="md"
              style={{
                backgroundColor: item.isRead ? 'var(--surface)' : 'rgba(212, 168, 83, 0.06)',
                border: item.isRead ? '1px solid var(--border)' : '1.5px solid var(--accent)',
                cursor: 'pointer',
              }}
              onClick={() => !item.isRead && handleMarkRead(item.id)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ marginTop: '2px' }}>{getIcon(item.type)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.title}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px', lineHeight: 1.5 }}>
                    {item.message}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
