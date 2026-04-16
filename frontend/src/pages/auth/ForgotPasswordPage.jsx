import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { checkUserPhone, createUserDataRequest } from '../../services/api/auth';
import { extractApiError } from '../../utils/api';

export default function ForgotPasswordPage() {
  const [form, setForm] = useState({ phone: '', notes: '' });
  const [step, setStep] = useState('verify');
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const handleVerify = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '', success: '' });
    try {
      await checkUserPhone({ phone: form.phone });
      setStep('confirm');
      setStatus({ loading: false, error: '', success: 'تم العثور على الرقم. يمكنك الآن تأكيد إرسال الطلب.' });
    } catch (error) {
      setStep('verify');
      setStatus({ loading: false, error: extractApiError(error), success: '' });
    }
  };

  const handleConfirm = async () => {
    setStatus({ loading: true, error: '', success: '' });
    try {
      const response = await createUserDataRequest(form);
      setStatus({ loading: false, error: '', success: response.data?.message || 'تم تقديم طلبك، جاري مراجعته وسوف تتلقى رسالة على الواتساب الخاص بك' });
      setForm({ phone: '', notes: '' });
      setStep('verify');
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error), success: '' });
    }
  };

  return (
    <section className="auth-section">
      <Card className="auth-card" title="طلب نسيان كلمة المرور أو تعديل البيانات">
        <form className="form-card" onSubmit={handleVerify}>
          <label>
            <span>رقم الهاتف</span>
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="أدخل رقم الهاتف المسجل" />
          </label>
          <label>
            <span>ملاحظات</span>
            <textarea rows="4" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="مثال: نسيت الباسورد، أريد تعديل رقم الواتساب" />
          </label>
          {status.error ? <p className="error-text">{status.error}</p> : null}
          {status.success ? <p className="success-text">{status.success}</p> : null}
          {step === 'verify' ? (
            <Button type="submit" disabled={status.loading}>{status.loading ? 'جارٍ التحقق...' : 'تحقق من الرقم'}</Button>
          ) : (
            <Button type="button" onClick={handleConfirm} disabled={status.loading}>{status.loading ? 'جارٍ إرسال الطلب...' : 'اضغط لتأكيد إرسال الطلب'}</Button>
          )}
        </form>
      </Card>
    </section>
  );
}
