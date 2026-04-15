import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { getMyProfile } from '../../services/api/users';
import { getMyOrders, getMyCard } from '../../services/api/cards';
import { extractApiError, formatDate } from '../../utils/api';

export default function DashboardPage() {
  const { authState } = useAuth();
  const isPro = authState.user?.currentPlan === 'PRO';
  const [data, setData] = useState({ profile: null, orders: [], card: null });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, ordersRes, cardRes] = await Promise.allSettled([
          getMyProfile(),
          getMyOrders(),
          getMyCard(),
        ]);

        const safeOrders = Array.isArray(ordersRes.status === 'fulfilled' ? ordersRes.value.data.data : [])
          ? (ordersRes.status === 'fulfilled' ? ordersRes.value.data.data : []).filter((item) => item && typeof item === 'object')
          : [];

        setData({
          profile: profileRes.status === 'fulfilled' ? profileRes.value.data.data : null,
          orders: safeOrders,
          card: cardRes.status === 'fulfilled' ? cardRes.value.data.data : null,
        });

        if (profileRes.status === 'rejected' && ordersRes.status === 'rejected') {
          setError(extractApiError(profileRes.reason));
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const latestOrder = data.orders?.[0] || null;
  const linksCount = data.profile?.socialLinks?.length || 0;
  const productsCount = data.profile?.products?.length || 0;
  const visibleOrders = useMemo(() => data.orders.filter((order) => order?._id), [data.orders]);

  return (
    <div className="stack-lg">
      <PageHeader
        title="مرحبًا بك"
        text="نظرة سريعة على حسابك وحالة الطلبات والبطاقة."
        badge={{ label: authState.user?.currentPlan || 'NONE', tone: isPro ? 'info' : 'success' }}
      />

      {error ? <Card><p className="error-text">{error}</p></Card> : null}

      <div className="stats-grid">
        <StatCard label="حالة الحساب" value={authState.user?.status || 'active'} hint="من بيانات الحساب" />
        <StatCard label="حالة البطاقة" value={data.card?.isActive ? 'مفعلة' : latestOrder?.orderStatus || 'لا توجد'} hint="آخر حالة متاحة" />
        <StatCard label="عدد الطلبات" value={loading ? '...' : String(visibleOrders.length)} hint="كل الطلبات" />
        <StatCard label="الروابط / الأعمال" value={`${linksCount} / ${productsCount}`} hint="روابط السوشيال والمنتجات" />
      </div>

      <div className="grid grid-2">
        <Card title="آخر الطلبات">
          <div className="stack-md">
            {visibleOrders.length ? visibleOrders.slice(0, 3).map((order, index) => (
              <div key={order._id || `order-${index}`} className="row-line">
                <div>
                  <strong>{order.cardPlanId?.name || 'خطة'}</strong>
                  <p>{formatDate(order.createdAt)}</p>
                </div>
                <Badge tone={order.orderStatus}>{order.orderStatus}</Badge>
              </div>
            )) : <p>{loading ? 'جارٍ التحميل...' : 'لا توجد طلبات بعد.'}</p>}
          </div>
        </Card>
        <Card title="ملخص الحساب">
          <div className="stack-md">
            <div className="notice-card notice-info">
              <strong>Slug</strong>
              <p>{data.profile?.user?.profileSlug || authState.user?.profileSlug || '-'}</p>
            </div>
            <div className="notice-card notice-success">
              <strong>البطاقة الحالية</strong>
              <p>{data.card?.cardCode || 'لم يتم إنشاء بطاقة بعد.'}</p>
            </div>
            <div className="notice-card">
              <strong>آخر تحديث للبروفايل</strong>
              <p>{formatDate(data.profile?.user?.updatedAt || authState.user?.updatedAt)}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
