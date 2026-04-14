import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { listAdminReceipts, reviewReceipt } from '../../services/api/payments';
import { extractApiError, formatDate, formatMoney } from '../../utils/api';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '' });

  const load = async () => {
    try {
      const { data } = await listAdminReceipts();
      setPayments(data.data.data || []);
      setStatus({ loading: false, error: '' });
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error) });
    }
  };

  useEffect(() => { load(); }, []);

  const handleReview = async (receiptId, reviewStatus) => {
    const reviewNote = window.prompt('اكتب ملاحظة المراجعة', reviewStatus === 'approved' ? 'تمت الموافقة' : 'تم الرفض');
    try {
      await reviewReceipt(receiptId, { reviewStatus, reviewNote: reviewNote || '' });
      await load();
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error) });
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader title="مراجعة المدفوعات" text="قبول أو رفض الإيصالات مع عرض صورة الإيصال بوضوح داخل الداشبورد." />
      {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}
      <div className="stack-md">
        {payments.map((payment) => (
          <Card key={payment._id} title={`${payment.userId?.fullName || '-'} — ${formatMoney(payment.transferredAmount)}`}>
            <div className="grid grid-2">
              <div className="stack-md">
                <div className="row-line"><strong>رقم الطلب</strong><span>{payment.cardOrderId?._id || '-'}</span></div>
                <div className="row-line"><strong>الخطة</strong><span>{payment.cardOrderId?.cardPlanId?.name || '-'}</span></div>
                <div className="row-line"><strong>المرسل</strong><span>{payment.senderName} / {payment.senderPhone}</span></div>
                <div className="row-line"><strong>التاريخ</strong><span>{formatDate(payment.createdAt)}</span></div>
                <div className="row-line"><strong>الحالة</strong><Badge tone={payment.reviewStatus}>{payment.reviewStatus}</Badge></div>
                <div className="row-line"><strong>الملاحظة</strong><span>{payment.reviewNote || payment.note || '-'}</span></div>
                <div className="row-actions">
                  {payment.reviewStatus === 'pending' ? (
                    <>
                      <Button onClick={() => handleReview(payment._id, 'approved')}>قبول</Button>
                      <Button variant="secondary" onClick={() => handleReview(payment._id, 'rejected')}>رفض</Button>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="receipt-preview-card">
                {payment.receiptImage ? (
                  <a href={payment.receiptImage} target="_blank" rel="noreferrer">
                    <img className="receipt-preview-image" src={payment.receiptImage} alt="Receipt" />
                  </a>
                ) : (
                  <div className="preview-card">لا توجد صورة</div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
