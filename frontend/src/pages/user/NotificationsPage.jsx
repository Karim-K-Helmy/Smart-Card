import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import { getMyNotifications } from '../../services/api/users';
import { extractApiError, formatDate } from '../../utils/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getMyNotifications();
        setNotifications(data.data?.notices || []);
        setStatus({ loading: false, error: '' });
      } catch (error) {
        setStatus({ loading: false, error: extractApiError(error) });
      }
    };
    load();
  }, []);

  return (
    <div className="stack-lg">
      <PageHeader title="الإشعارات" text="آخر التحديثات المتعلقة بالحساب والطلبات والمدفوعات." />
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
