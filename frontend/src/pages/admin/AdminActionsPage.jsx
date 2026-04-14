import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import { listActions } from '../../services/api/admin';
import { extractApiError, formatDate } from '../../utils/api';

export default function AdminActionsPage() {
  const [actions, setActions] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await listActions();
        setActions(data.data.data || []);
        setStatus({ loading: false, error: '' });
      } catch (error) {
        setStatus({ loading: false, error: extractApiError(error) });
      }
    };
    load();
  }, []);

  return (
    <div className="stack-lg">
      <PageHeader title="سجل عمليات الأدمن" text="مراجعة كل العمليات المهمة مثل التجميد وقبول المدفوعات." />
      {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}
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
