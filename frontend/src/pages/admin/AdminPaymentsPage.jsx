import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { markAdminNotificationAsRead } from '../../services/api/admin';
import { listAdminReceipts, reviewReceipt } from '../../services/api/payments';
import { extractApiError, formatDate, formatMoney } from '../../utils/api';

const BADGE_SYNC_EVENT = 'dashboard-badge-sync';

const initialReviewState = {
  open: false,
  saving: false,
  error: '',
  receiptId: '',
  reviewStatus: 'approved',
  reviewNote: '',
  payment: null,
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '' });
  const [reviewState, setReviewState] = useState(initialReviewState);

  const load = async () => {
    try {
      const { data } = await listAdminReceipts();
      setPayments(data.data.data || []);
      setStatus({ loading: false, error: '' });
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error) });
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.allSettled([markAdminNotificationAsRead('payments'), load()]);
      window.dispatchEvent(new CustomEvent(BADGE_SYNC_EVENT, { detail: { area: 'admin', key: 'payments' } }));
    };

    init();
  }, []);

  const openReviewModal = (payment, nextStatus) => {
    setReviewState({
      open: true,
      saving: false,
      error: '',
      receiptId: payment._id,
      reviewStatus: nextStatus,
      reviewNote: nextStatus === 'approved' ? 'تمت الموافقة' : 'تم الرفض',
      payment,
    });
  };

  const closeReviewModal = () => setReviewState(initialReviewState);

  const submitReview = async (event) => {
    event.preventDefault();
    setReviewState((prev) => ({ ...prev, saving: true, error: '' }));
    try {
      await reviewReceipt(reviewState.receiptId, {
        reviewStatus: reviewState.reviewStatus,
        reviewNote: reviewState.reviewNote || '',
      });
      await load();
      closeReviewModal();
    } catch (error) {
      setReviewState((prev) => ({ ...prev, saving: false, error: extractApiError(error) }));
    }
  };

  return (
    <>
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
                        <Button onClick={() => openReviewModal(payment, 'approved')}>قبول</Button>
                        <Button variant="secondary" onClick={() => openReviewModal(payment, 'rejected')}>رفض</Button>
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

      <Modal
        open={reviewState.open}
        onClose={closeReviewModal}
        size="lg"
        title={reviewState.reviewStatus === 'approved' ? 'قبول الإيصال' : 'رفض الإيصال'}
        description={reviewState.payment ? `المستخدم: ${reviewState.payment.userId?.fullName || '-'} — ${formatMoney(reviewState.payment.transferredAmount)}` : ''}
        footer={(
          <>
            <Button variant="ghost" onClick={closeReviewModal}>إلغاء</Button>
            <Button onClick={submitReview} disabled={reviewState.saving}>{reviewState.saving ? 'جارٍ الحفظ...' : 'حفظ المراجعة'}</Button>
          </>
        )}
      >
        <form className="stack-md" onSubmit={submitReview}>
          <label>
            <span>ملاحظة المراجعة</span>
            <textarea rows="6" value={reviewState.reviewNote} onChange={(e) => setReviewState((prev) => ({ ...prev, reviewNote: e.target.value }))} />
          </label>
          {reviewState.error ? <p className="error-text">{reviewState.error}</p> : null}
        </form>
      </Modal>
    </>
  );
}
