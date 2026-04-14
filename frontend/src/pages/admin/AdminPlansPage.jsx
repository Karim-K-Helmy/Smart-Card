import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { createCardPlan, deleteCardPlan, getCardPlans } from '../../services/api/cards';
import { extractApiError, formatMoney } from '../../utils/api';

const emptyForm = { name: '', description: '', features: '', price: '', durationDays: '30', isActive: true };

export default function AdminPlansPage() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', success: '' });

  const load = async () => {
    try {
      const { data } = await getCardPlans();
      setPlans(data.data || []);
      setStatus((prev) => ({ ...prev, loading: false, error: '' }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, loading: false, error: extractApiError(error) }));
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setStatus((prev) => ({ ...prev, saving: true, error: '', success: '' }));
    try {
      await createCardPlan({
        ...form,
        price: Number(form.price),
        durationDays: Number(form.durationDays),
        features: form.features.split(',').map((item) => item.trim()).filter(Boolean),
      });
      setForm(emptyForm);
      setStatus((prev) => ({ ...prev, success: 'تمت إضافة الخطة.' }));
      await load();
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleDelete = async (planId) => {
    try {
      await deleteCardPlan(planId);
      await load();
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader title="إدارة الباقات" text="إضافة خطط البطاقات والأسعار والمدد." />
      <div className="grid grid-2">
        <Card title="إضافة خطة جديدة">
          <form className="form-card" onSubmit={handleCreate}>
            <label><span>اسم الخطة</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label><span>الوصف</span><textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label><span>المميزات (مفصولة بفاصلة)</span><textarea rows="3" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} /></label>
            <div className="form-grid">
              <label><span>السعر</span><input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></label>
              <label><span>المدة بالأيام</span><input type="number" min="1" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} required /></label>
            </div>
            {status.error ? <p className="error-text">{status.error}</p> : null}
            {status.success ? <p className="success-text">{status.success}</p> : null}
            <Button type="submit" disabled={status.saving}>{status.saving ? 'جارٍ الحفظ...' : 'إضافة خطة'}</Button>
          </form>
        </Card>
        <Card title="الخطط الحالية">
          <div className="stack-md">
            {plans.map((plan) => (
              <div key={plan._id} className="product-row">
                <div>
                  <strong>{plan.name}</strong>
                  <p>{plan.description}</p>
                  <small>{plan.durationDays} يوم</small>
                </div>
                <div className="row-actions align-end">
                  <strong>{formatMoney(plan.price)}</strong>
                  <Button variant="ghost" onClick={() => handleDelete(plan._id)}>حذف</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
