import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getMyProfile, updateProfile } from '../../services/api/users';
import { extractApiError } from '../../utils/api';
import { translateDisplayValue } from '../../utils/display';

export default function PersonalProfilePage({ embedded = false }) {
  const [form, setForm] = useState({ jobTitle: '', aboutText: '', birthDate: '' });
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', success: '', currentPlan: 'NONE' });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getMyProfile();
        const profile = data.data.personalProfile || {};
        setForm({
          jobTitle: profile.jobTitle || '',
          aboutText: profile.aboutText || '',
          birthDate: profile.birthDate ? String(profile.birthDate).slice(0, 10) : '',
        });
        setStatus((prev) => ({ ...prev, currentPlan: data.data.user?.currentPlan || 'NONE' }));
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
      await updateProfile(form);
      setStatus((prev) => ({ ...prev, success: 'تم حفظ البيانات الشخصية بنجاح.' }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  return (
    <div className={embedded ? 'stack-md profile-section-embedded' : 'stack-lg'}>
      {!embedded ? <PageHeader title="البروفايل الشخصي" text="بياناتك الأساسية تظهر بشكل مختصر في باقة Star ويمكن الاستفادة منها أيضًا داخل باقة Pro." /> : null}
      <Card icon="fa-user-large">
        <p className="muted">الباقة الحالية: {translateDisplayValue(status.currentPlan)}</p>
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label><span>المسمى التعريفي</span><input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} /></label>
            <label><span>تاريخ الميلاد</span><input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></label>
          </div>
          <label><span>نبذة مختصرة</span><textarea rows="5" value={form.aboutText} onChange={(e) => setForm({ ...form, aboutText: e.target.value })} /></label>
          {status.error ? <p className="error-text">{status.error}</p> : null}
          {status.success ? <p className="success-text">{status.success}</p> : null}
          <Button type="submit" disabled={status.saving}>{status.saving ? 'جارٍ الحفظ...' : 'حفظ البيانات'}</Button>
        </form>
      </Card>
    </div>
  );
}
