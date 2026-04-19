import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import { getMyNotifications, markMyNotificationAsRead } from '../../services/api/users';
import { extractApiError, formatDate } from '../../utils/api';

const BADGE_SYNC_EVENT = 'dashboard-badge-sync';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const [notificationsRes] = await Promise.all([
          getMyNotifications(),
          markMyNotificationAsRead('notifications'),
        ]);
        setNotifications(notificationsRes.data.data?.notices || []);
        window.dispatchEvent(new CustomEvent(BADGE_SYNC_EVENT, { detail: { area: 'user', key: 'notifications' } }));
        setStatus({ loading: false, error: '' });
      } catch (error) {
        setStatus({ loading: false, error: extractApiError(error) });
      }
    };
    load();
  }, []);

  return (
    <div className="stack-lg">
      <PageHeader title="الإشعارات" text="آخر التحديثات المتعلقة بالحساب والطلبات والمدفوعات وحالة البطاقة." />
      {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}
      <Card>
        <div className="stack-md">
          {notifications.map((notice) => (
            <div key={notice.id} className={`notice-card notice-${notice.status}`}>
              <strong>{notice.title}</strong>
              <p>{notice.text}</p>
              <small>{formatDate(notice.createdAt)}</small>
            </div>
          ))}
          {!status.loading && !notifications.length ? <p>لا توجد إشعارات حالياً.</p> : null}
        </div>
      </Card>
    </div>
  );
}
