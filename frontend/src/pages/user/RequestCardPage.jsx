import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { checkoutCard, getCardPlans } from '../../services/api/cards';
import { listPaymentMethods } from '../../services/api/payments';
import { getMyProfile } from '../../services/api/users';
import { extractApiError, formatMoney, toFormData } from '../../utils/api';

export default function RequestCardPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [methods, setMethods] = useState([]);
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', success: '' });
  const [form, setForm] = useState({
    cardPlanId: '',
    paymentMethodId: '',
    senderName: '',
    senderPhone: '',
    transferredAmount: '',
    transferDate: '',
    notes: '',
    note: '',
    jobTitle: '',
    aboutText: '',
    businessName: '',
    businessDescription: '',
    address: '',
    receiptImage: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [plansRes, methodsRes, profileRes] = await Promise.all([
          getCardPlans(),
          listPaymentMethods(),
          getMyProfile(),
        ]);

        const fetchedPlans = (plansRes.data.data || []).filter((plan) => ['STAR', 'PRO'].includes(plan.planCode));
        const fetchedMethods = methodsRes.data.data || [];
        const profile = profileRes.data.data || {};

        setPlans(fetchedPlans);
        setMethods(fetchedMethods);
        setForm((prev) => ({
          ...prev,
          cardPlanId: fetchedPlans[0]?._id || '',
          paymentMethodId: fetchedMethods[0]?._id || '',
          transferredAmount: fetchedPlans[0]?.price || '',
          jobTitle: profile.personalProfile?.jobTitle || '',
          aboutText: profile.personalProfile?.aboutText || '',
          businessName: profile.businessProfile?.businessName || '',
          businessDescription: profile.businessProfile?.businessDescription || '',
          address: profile.businessProfile?.address || '',
        }));
      } catch (error) {
        setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
      } finally {
        setStatus((prev) => ({ ...prev, loading: false }));
      }
    };
    load();
  }, []);

  const selectedPlan = useMemo(() => plans.find((plan) => plan._id === form.cardPlanId) || null, [plans, form.cardPlanId]);

  useEffect(() => {
    if (selectedPlan) {
      setForm((prev) => ({ ...prev, transferredAmount: selectedPlan.price }));
    }
  }, [selectedPlan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus((prev) => ({ ...prev, saving: true, error: '', success: '' }));
    try {
      const payload = toFormData({
        cardPlanId: form.cardPlanId,
        paymentMethodId: form.paymentMethodId,
        senderName: form.senderName,
        senderPhone: form.senderPhone,
        transferredAmount: form.transferredAmount,
        transferDate: form.transferDate,
        notes: form.notes,
        note: form.note,
        jobTitle: form.jobTitle,
        aboutText: form.aboutText,
        businessName: form.businessName,
        businessDescription: form.businessDescription,
        address: form.address,
        receiptImage: form.receiptImage,
      });
      await checkoutCard(payload);
      setStatus((prev) => ({ ...prev, success: 'تم إرسال طلب البطاقة والإيصال بنجاح.' }));
      navigate('/dashboard/orders', { replace: true });
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader title="طلب البطاقة الموحد" text="اختر Star أو Pro، ثم أكمل بيانات البطاقة وارفع إيصال الدفع من نفس النموذج." />
      {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}
      <form className="stack-lg" onSubmit={handleSubmit}>
        <div className="grid grid-2">
          <Card title="1) اختيار الباقة">
            <div className="stack-md">
              {plans.map((plan) => (
                <label key={plan._id} className={`select-card ${form.cardPlanId === plan._id ? 'select-card-active' : ''}`}>
                  <input
                    type="radio"
                    name="cardPlanId"
                    value={plan._id}
                    checked={form.cardPlanId === plan._id}
                    onChange={() => setForm((prev) => ({ ...prev, cardPlanId: plan._id, transferredAmount: plan.price }))}
                  />
                  <div>
                    <strong>{plan.name}</strong>
                    <p>{plan.description}</p>
                    <small>{formatMoney(plan.price)} / {plan.durationDays} يوم</small>
                  </div>
                </label>
              ))}
              {!plans.length && !status.loading ? <p>لا توجد باقات حالياً.</p> : null}
            </div>
          </Card>
          <Card title="2) وسيلة الدفع والإيصال">
            <div className="form-card">
              <label><span>وسيلة الدفع</span><select value={form.paymentMethodId} onChange={(e) => setForm({ ...form, paymentMethodId: e.target.value })}>{methods.map((method) => <option key={method._id} value={method._id}>{method.methodName} - {method.phoneNumber}</option>)}</select></label>
              <div className="form-grid">
                <label><span>اسم المحول</span><input required value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} /></label>
                <label><span>رقم المحول</span><input required value={form.senderPhone} onChange={(e) => setForm({ ...form, senderPhone: e.target.value })} /></label>
              </div>
              <div className="form-grid">
                <label><span>المبلغ المحول</span><input required type="number" min="0" value={form.transferredAmount} onChange={(e) => setForm({ ...form, transferredAmount: e.target.value })} /></label>
                <label><span>تاريخ التحويل</span><input type="date" value={form.transferDate} onChange={(e) => setForm({ ...form, transferDate: e.target.value })} /></label>
              </div>
              <label><span>صورة الإيصال</span><input type="file" required onChange={(e) => setForm({ ...form, receiptImage: e.target.files?.[0] || null })} /></label>
              <label><span>ملاحظة على الدفع</span><textarea rows="3" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
            </div>
          </Card>
        </div>

        <div className="grid grid-2">
          <Card title="3) بيانات البطاقة">
            <div className="form-card">
              <div className="form-grid">
                <label><span>المسمى الوظيفي</span><input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} /></label>
                <label><span>اسم النشاط التجاري</span><input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></label>
              </div>
              <label><span>نبذة تعريفية</span><textarea rows="4" value={form.aboutText} onChange={(e) => setForm({ ...form, aboutText: e.target.value })} /></label>
              <label><span>وصف النشاط التجاري</span><textarea rows="4" value={form.businessDescription} onChange={(e) => setForm({ ...form, businessDescription: e.target.value })} /></label>
              <label><span>العنوان</span><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
            </div>
          </Card>
          <Card title="4) ملاحظات الطلب">
            <div className="form-card">
              <label><span>ملاحظات إضافية للأدمن</span><textarea rows="5" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="أي تعليمات إضافية بخصوص البطاقة أو التفعيل" /></label>
              <div className="notice-card notice-info">
                <strong>مراجعة سريعة</strong>
                <p>الباقة المختارة: {selectedPlan?.name || '-'}</p>
                <p>القيمة المطلوبة: {selectedPlan ? formatMoney(selectedPlan.price) : '-'}</p>
                <p>سيتم إرسال الطلب بالكامل مرة واحدة إلى لوحة الأدمن.</p>
              </div>
            </div>
          </Card>
        </div>

        {status.success ? <p className="success-text">{status.success}</p> : null}
        <Button type="submit" disabled={status.saving || status.loading}>{status.saving ? 'جارٍ إرسال الطلب...' : 'إرسال الطلب بالكامل'}</Button>
      </form>
    </div>
  );
}
