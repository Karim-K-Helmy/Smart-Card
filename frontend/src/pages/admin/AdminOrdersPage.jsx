import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { listOrders, markAdminNotificationAsRead } from '../../services/api/admin';
import { extractApiError, formatDate, formatMoney } from '../../utils/api';

const BADGE_SYNC_EVENT = 'dashboard-badge-sync';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '' });

  const load = async () => {
    try {
      const { data } = await listOrders();
      setOrders(data.data.data || []);
      setStatus({ loading: false, error: '' });
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error) });
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.allSettled([markAdminNotificationAsRead('orders'), load()]);
      window.dispatchEvent(new CustomEvent(BADGE_SYNC_EVENT, { detail: { area: 'admin', key: 'orders' } }));
    };

    init();
  }, []);

  return (
    <div className="stack-lg">
      <PageHeader title="إدارة الطلبات" text="عرض الطلبات وحالاتها مع الوصول السريع للتفاصيل." />
      {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}
      <Card>
        <div className="table-like">
          <div className="table-row table-head"><span>المستخدم</span><span>الخطة</span><span>المبلغ</span><span>الحالة</span><span>التاريخ</span><span>ملاحظات</span></div>
          {orders.map((order) => (
            <div key={order._id} className="table-row">
              <span>{order.userId?.fullName}</span>
              <span>{order.cardPlanId?.name}</span>
              <span>{formatMoney(order.totalAmount)}</span>
              <span><Badge tone={order.orderStatus}>{order.orderStatus}</Badge></span>
              <span>{formatDate(order.createdAt)}</span>
              <span>{order.notes || '-'}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
