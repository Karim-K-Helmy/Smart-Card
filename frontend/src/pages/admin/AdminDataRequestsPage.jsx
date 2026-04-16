import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { listDataRequests, updateDataRequestStatus } from '../../services/api/admin';
import { extractApiError, formatDate } from '../../utils/api';

const statusLabels = {
  pending: 'قيد الانتظار',
  in_review: 'تحت المراجعة',
  completed: 'تم التنفيذ',
  rejected: 'مرفوض',
};

export default function AdminDataRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '' });
  const [savingId, setSavingId] = useState('');

  const load = async () => {
    setStatus({ loading: true, error: '' });
    try {
      const { data } = await listDataRequests();
      setRequests(data.data || []);
      setStatus({ loading: false, error: '' });
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error) });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setRequestStatus = async (requestId, nextStatus) => {
    setSavingId(requestId);
    try {
      await updateDataRequestStatus(requestId, { status: nextStatus });
      await load();
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader
        title="طلبات العملاء"
        text="إدارة طلبات نسيان كلمة المرور وتعديل البيانات المرسلة يدويًا من العملاء عبر الواتساب."
        actions={<Button variant="secondary" onClick={load}>تحديث</Button>}
      />

      {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}

      <Card icon="fa-clipboard-list">
        <div className="table-like">
          <div className="table-row table-head admin-users-row">
            <span>رقم الهاتف</span><span>الملاحظات</span><span>الحالة</span><span>التاريخ</span><span>الإجراء</span>
          </div>
          {requests.map((request) => {
            const phoneDigits = String(request.phone || '').replace(/\D/g, '');
            return (
              <div key={request._id} className="table-row admin-users-row">
                <span dir="ltr">{request.phone}</span>
                <span>{request.notes || '—'}</span>
                <span><Badge tone={request.status === 'completed' ? 'success' : request.status === 'rejected' ? 'danger' : request.status === 'in_review' ? 'info' : 'warning'}>{statusLabels[request.status] || request.status}</Badge></span>
                <span>{formatDate(request.createdAt)}</span>
                <span className="row-actions">
                  <a className="btn btn-secondary" href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer">مراسلة واتساب</a>
                  <Button variant="ghost" onClick={() => setRequestStatus(request._id, 'in_review')} disabled={savingId === request._id}>تحت المراجعة</Button>
                  <Button onClick={() => setRequestStatus(request._id, 'completed')} disabled={savingId === request._id}>تم التنفيذ</Button>
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
