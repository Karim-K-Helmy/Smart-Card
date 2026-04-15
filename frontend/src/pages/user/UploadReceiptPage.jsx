import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getMyOrders } from '../../services/api/cards';
import { listPaymentMethods, submitReceipt } from '../../services/api/payments';
import { extractApiError, formatMoney } from '../../utils/api';

export default function UploadReceiptPage() {
  const { state } = useLocation();
  const [refs, setRefs] = useState({ order: state?.order || null, methods: [], methodId: state?.method?._id || '' });
  const [form, setForm] = useState({ senderName: '', senderPhone: '', transferredAmount: '', transferDate: '', note: '', receiptImage: null });
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', success: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const [methodsRes, ordersRes] = await Promise.all([listPaymentMethods(), getMyOrders()]);
        const methods = methodsRes.data.data || [];
        const order = state?.order || (ordersRes.data.data || []).find((item) => ['waiting_payment', 'pending', 'rejected'].includes(item.orderStatus));
        setRefs({ order, methods, methodId: state?.method?._id || methods[0]?._id || '' });
        setForm((prev) => ({ ...prev, transferredAmount: order?.totalAmount || prev.transferredAmount }));
      } catch (error) {
        setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
      } finally {
        setStatus((prev) => ({ ...prev, loading: false }));
      }
    };
    load();
  }, [state?.method?._id, state?.order]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus((prev) => ({ ...prev, saving: true, error: '', success: '' }));
    try {
      const payload = new FormData();
      payload.append('cardOrderId', refs.order._id);
      payload.append('paymentMethodId', refs.methodId);
      payload.append('senderName', form.senderName);
      payload.append('senderPhone', form.senderPhone);
      payload.append('transferredAmount', form.transferredAmount);
      if (form.transferDate) payload.append('transferDate', form.transferDate);
      if (form.note) payload.append('note', form.note);
      if (form.receiptImage) payload.append('receiptImage', form.receiptImage);
      await submitReceipt(payload);
      setStatus((prev) => ({ ...prev, success: 'تم إرسال الإيصال بنجاح وأصبح الطلب تحت المراجعة.' }));
      setForm({ senderName: '', senderPhone: '', transferredAmount: refs.order?.totalAmount || '', transferDate: '', note: '', receiptImage: null });
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  const hasVisiblePrice = Number(refs.order?.totalAmount || 0) > 0;

  return (
    <div className="stack-lg">
      <PageHeader title="رفع إيصال الدفع" text="أرسل صورة واضحة مع بيانات التحويل لتسريع المراجعة." />
      <Card>
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label><span>رقم الطلب</span><input value={refs.order?._id || ''} readOnly /></label>
            {hasVisiblePrice ? <label><span>المبلغ</span><input value={refs.order ? formatMoney(refs.order.totalAmount) : ''} readOnly /></label> : null}
          </div>
          <label><span>وسيلة الدفع</span><select value={refs.methodId} onChange={(e) => setRefs({ ...refs, methodId: e.target.value })}>{refs.methods.map((method) => <option key={method._id} value={method._id}>{method.methodName} - {method.phoneNumber}</option>)}</select></label>
          <div className="form-grid">
            <label><span>اسم المحول</span><input required value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} /></label>
            <label><span>رقم المحول</span><input required value={form.senderPhone} onChange={(e) => setForm({ ...form, senderPhone: e.target.value })} /></label>
          </div>
          <div className="form-grid">
            {hasVisiblePrice ? <label><span>مبلغ التحويل</span><input required type="number" min="0" value={form.transferredAmount} onChange={(e) => setForm({ ...form, transferredAmount: e.target.value })} /></label> : null}
            <label><span>تاريخ التحويل</span><input type="date" value={form.transferDate} onChange={(e) => setForm({ ...form, transferDate: e.target.value })} /></label>
          </div>
          <label><span>صورة الوصل</span><input type="file" required onChange={(e) => setForm({ ...form, receiptImage: e.target.files?.[0] || null })} /></label>
          <label><span>ملاحظات إضافية</span><textarea rows="4" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
          {status.error ? <p className="error-text">{status.error}</p> : null}
          {status.success ? <p className="success-text">{status.success}</p> : null}
          <Button type="submit" disabled={status.saving || !refs.order}>{status.saving ? 'جارٍ الإرسال...' : 'إرسال الوصل'}</Button>
        </form>
      </Card>
    </div>
  );
}
