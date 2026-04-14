import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { listActions, listAdmins } from '../../services/api/admin';
import { extractApiError, formatDate } from '../../utils/api';

const actionOptions = ['', 'create', 'freeze', 'unfreeze', 'edit', 'delete', 'approve_payment', 'reject_payment'];

export default function AdminActionsPage() {
  const [actions, setActions] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [filters, setFilters] = useState({
    actionType: '',
    adminId: '',
    fromDate: '',
    toDate: '',
  });
  const [status, setStatus] = useState({ loading: true, error: '' });

  const load = async () => {
    setStatus({ loading: true, error: '' });
    try {
      const [actionsRes, adminsRes] = await Promise.all([
        listActions(filters),
        listAdmins(),
      ]);
      setActions(actionsRes.data.data.data || []);
      setAdmins(adminsRes.data.data || []);
      setStatus({ loading: false, error: '' });
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error) });
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="stack-lg">
      <PageHeader title="سجل عمليات الأدمن" text="فلترة النتائج حسب نوع العملية والتاريخ واسم المدير الذي قام بها." />
      {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}

      <Card>
        <div className="form-grid">
          <label>
            <span>نوع العملية</span>
            <select value={filters.actionType} onChange={(e) => setFilters((prev) => ({ ...prev, actionType: e.target.value }))}>
              {actionOptions.map((item) => (
                <option key={item || 'all'} value={item}>{item || 'الكل'}</option>
              ))}
            </select>
          </label>

          <label>
            <span>اسم المدير</span>
            <select value={filters.adminId} onChange={(e) => setFilters((prev) => ({ ...prev, adminId: e.target.value }))}>
              <option value="">الكل</option>
              {admins.map((admin) => (
                <option key={admin._id} value={admin._id}>{admin.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span>من تاريخ</span>
            <input type="date" value={filters.fromDate} onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))} />
          </label>

          <label>
            <span>إلى تاريخ</span>
            <input type="date" value={filters.toDate} onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))} />
          </label>
        </div>

        <div className="header-actions">
          <Button onClick={load}>تطبيق الفلاتر</Button>
        </div>
      </Card>

      <Card>
        <div className="table-like">
          <div className="table-row table-head"><span>الأدمن</span><span>الإجراء</span><span>الهدف</span><span>الملاحظات</span><span>التاريخ</span></div>
          {actions.map((action) => (
            <div key={action._id} className="table-row">
              <span>{action.adminId?.name || '-'}</span>
              <span>{action.actionType}</span>
              <span>{action.targetTable} / {action.targetId}</span>
              <span>{action.notes || '-'}</span>
              <span>{formatDate(action.createdAt)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
