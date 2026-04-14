import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { listOrders } from '../../services/api/admin';
import { extractApiError, formatDate, formatMoney } from '../../utils/api';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await listOrders();
        setOrders(data.data.data || []);
      } catch (error) {
        setStatus({ loading: false, error: extractApiError(error) });
        return;
      }
      setStatus({ loading: false, error: '' });
    };
    load();
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
