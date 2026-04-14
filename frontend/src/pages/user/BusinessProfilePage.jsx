import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getCategories } from '../../services/api/categories';
import { getMyProfile, updateProfile } from '../../services/api/users';
import { extractApiError } from '../../utils/api';

export default function BusinessProfilePage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    businessName: '',
    businessDescription: '',
    address: '',
    categoryId: '',
    promoBoxText: '',
    logo: null,
  });
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', success: '', currentPlan: 'NONE' });

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, categoriesRes] = await Promise.all([getMyProfile(), getCategories()]);
        const business = profileRes.data.data.businessProfile || {};
        setForm({
          businessName: business.businessName || '',
          businessDescription: business.businessDescription || '',
          address: business.address || '',
          categoryId: business.categoryId?._id || '',
          promoBoxText: business.promoBoxText || '',
          logo: null,
        });
        setCategories(categoriesRes.data.data || []);
        setStatus((prev) => ({ ...prev, currentPlan: profileRes.data.data.user?.currentPlan || 'NONE' }));
      } catch (error) {
        setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
      } finally {
        setStatus((prev) => ({ ...prev, loading: false }));
      }
    };
    load();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus((prev) => ({ ...prev, saving: true, error: '', success: '' }));
    try {
      await updateProfile({
        businessName: form.businessName,
        businessDescription: form.businessDescription,
        address: form.address,
        categoryId: form.categoryId,
        promoBoxText: form.promoBoxText,
        logo: form.logo,
      });
      setStatus((prev) => ({ ...prev, success: 'تم حفظ البيانات التجارية بنجاح.' }));
      setForm((prev) => ({ ...prev, logo: null }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader title="البروفايل التجاري" text="هذه البيانات تظهر بالكامل عند تفعيل باقة Pro، ويمكنك تجهيزها مسبقًا من الآن." />
      <Card icon="fa-building">
        <div className="brand-pill">{status.currentPlan === 'PRO' ? 'باقة Pro مفعّلة' : 'جاهز للترقية إلى Pro'}</div>
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label><span>اسم النشاط أو العلامة</span><input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></label>
            <label><span>التصنيف</span><select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">بدون تصنيف</option>{categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
          </div>
          <label><span>وصف النشاط</span><textarea rows="4" value={form.businessDescription} onChange={(e) => setForm({ ...form, businessDescription: e.target.value })} /></label>
          <div className="form-grid">
            <label><span>العنوان</span><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
            <label><span>الشعار</span><input type="file" onChange={(e) => setForm({ ...form, logo: e.target.files?.[0] || null })} /></label>
          </div>
          <label><span>النص الترويجي</span><textarea rows="3" value={form.promoBoxText} onChange={(e) => setForm({ ...form, promoBoxText: e.target.value })} /></label>
          {status.error ? <p className="error-text">{status.error}</p> : null}
          {status.success ? <p className="success-text">{status.success}</p> : null}
          <Button type="submit" disabled={status.saving}>{status.saving ? 'جارٍ الحفظ...' : 'حفظ البيانات'}</Button>
        </form>
      </Card>
    </div>
  );
}
