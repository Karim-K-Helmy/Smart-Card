import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import StatusTimeline from '../../components/common/StatusTimeline';
import { getMyOrders } from '../../services/api/cards';
import { listMyReceipts } from '../../services/api/payments';
import { markMyNotificationAsRead } from '../../services/api/users';
import { extractApiError, formatDate, formatMoney } from '../../utils/api';
import { translateDisplayValue } from '../../utils/display';

const BADGE_SYNC_EVENT = 'dashboard-badge-sync';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, receiptsRes] = await Promise.all([
          getMyOrders(),
          listMyReceipts(),
          markMyNotificationAsRead('orders'),
        ]);
        const safeOrders = Array.isArray(ordersRes.data.data) ? ordersRes.data.data.filter((item) => item && typeof item === 'object') : [];
        const safeReceipts = Array.isArray(receiptsRes.data.data) ? receiptsRes.data.data.filter((item) => item && typeof item === 'object') : [];
        setOrders(safeOrders);
        setReceipts(safeReceipts);
        window.dispatchEvent(new CustomEvent(BADGE_SYNC_EVENT, { detail: { area: 'user', key: 'orders' } }));
      } catch (error) {
        setStatus({ loading: false, error: extractApiError(error) });
        return;
      }
      setStatus({ loading: false, error: '' });
    };
    load();
  }, []);

  const visibleOrders = useMemo(() => orders.filter((order) => order?._id), [orders]);
  const latest = visibleOrders[0] || null;
  const latestReceipt = latest ? receipts.find((item) => item?.cardOrderId?._id === latest._id) : null;
  const latestHasVisiblePrice = Number(latest?.totalAmount || 0) > 0;

  return (
    <div className="stack-lg">
      <PageHeader title="الطلبات وحالة البطاقة" text="تابع كل مرحلة من إنشاء الطلب حتى اعتماد الدفع أو الرفض." />
      {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}
      <div className="grid grid-2">
        <Card title="أحدث طلب" icon="fa-clipboard-list">
          {latest ? (
            <>
              <div className="stack-md">
                <div className="row-line"><strong>رقم الطلب</strong><span>{latest._id}</span></div>
                <div className="row-line"><strong>الباقة</strong><span>{latest.cardPlanId?.name || '-'}</span></div>
                {latestHasVisiblePrice ? <div className="row-line"><strong>المبلغ</strong><span>{formatMoney(latest.totalAmount)}</span></div> : null}
                <div className="row-line"><strong>الحالة</strong><Badge tone={latest.orderStatus}>{latest.orderStatus}</Badge></div>
                <div className="row-line"><strong>آخر إيصال</strong><span>{latestReceipt ? translateDisplayValue(latestReceipt.reviewStatus) : 'لا يوجد'}</span></div>
              </div>
              <StatusTimeline status={latest.orderStatus} />
            </>
          ) : <p>{status.loading ? 'جارٍ التحميل...' : 'لا توجد طلبات بعد.'}</p>}
        </Card>
        <Card title="كل الطلبات" icon="fa-id-card">
          <div className="stack-md">
            {visibleOrders.length ? visibleOrders.map((order, index) => {
              const orderHasVisiblePrice = Number(order.totalAmount || 0) > 0;

              return (
                <div key={order._id || `order-${index}`} className="order-summary">
                  <div>
                    <strong>{order.cardPlanId?.name || '-'}</strong>
                    <p>{formatDate(order.createdAt)}{orderHasVisiblePrice ? ` — ${formatMoney(order.totalAmount)}` : ''}</p>
                  </div>
                  <Badge tone={order.orderStatus}>{order.orderStatus}</Badge>
                </div>
              );
            }) : <p>لا توجد طلبات.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
