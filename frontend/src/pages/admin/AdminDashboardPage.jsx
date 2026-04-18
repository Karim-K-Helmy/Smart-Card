import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import { getDashboard, listUsers } from '../../services/api/admin';
import { listAdminReceipts } from '../../services/api/payments';
import { extractApiError, formatMoney } from '../../utils/api';
import { translateDisplayValue } from '../../utils/display';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const [dashboardRes, usersRes, receiptsRes] = await Promise.allSettled([
        getDashboard(),
        listUsers({ limit: 5 }),
        listAdminReceipts({ limit: 5 }),
      ]);

      const errors = [];

      if (dashboardRes.status === 'fulfilled') {
        setStats(dashboardRes.value.data.data);
      } else {
        errors.push(extractApiError(dashboardRes.reason));
      }

      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.data.data.data || []);
      } else {
        errors.push(extractApiError(usersRes.reason));
      }

      if (receiptsRes.status === 'fulfilled') {
        setReceipts(receiptsRes.value.data.data.data || []);
      } else {
        errors.push(extractApiError(receiptsRes.reason));
      }

      setError(errors[0] || '');
    };
    load();
  }, []);

  return (
    <div className="stack-lg">
      <PageHeader title="لوحة تحكم الأدمن" text="إحصاءات سريعة وآخر الأنشطة المهمة داخل المنصة." />
      {error ? <Card><p className="error-text">{error}</p></Card> : null}
      <div className="stats-grid">
        <StatCard label="إجمالي المستخدمين" value={stats?.users ?? '...'} icon="fa-users" />
        <StatCard label="مستخدمو Star" value={stats?.starUsers ?? '...'} icon="fa-id-card" />
        <StatCard label="مستخدمو Pro" value={stats?.proUsers ?? '...'} icon="fa-briefcase" />
        <StatCard label="إجمالي الطلبات" value={stats?.orders ?? '...'} icon="fa-clipboard-list" />
      </div>
      <div className="stats-grid stats-grid-three">
        <StatCard label="إيصالات معلقة" value={stats?.pendingReceipts ?? '...'} icon="fa-receipt" />
        <StatCard label="رسائل جديدة" value={stats?.newMessages ?? '...'} icon="fa-message" />
        <StatCard label="بطاقات مفعّلة" value={stats?.approvedCards ?? '...'} icon="fa-id-badge" />
      </div>
      <div className="grid grid-2">
        <Card title="آخر المستخدمين" icon="fa-users">
          <div className="table-like">
            {users.map((user) => (
              <div key={user._id} className="table-row compact-row">
                <span>{user.fullName}</span>
                <span>{translateDisplayValue(user.currentPlan || 'NONE')}</span>
                <span>{translateDisplayValue(user.status || 'active')}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="آخر المدفوعات" icon="fa-money-bill-wave">
          <div className="table-like">
            {receipts.map((receipt) => (
              <div key={receipt._id} className="table-row compact-row">
                <span>{receipt.userId?.fullName}</span>
                <span>{formatMoney(receipt.transferredAmount)}</span>
                <span>{translateDisplayValue(receipt.reviewStatus)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
