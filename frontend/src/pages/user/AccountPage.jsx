import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { changePassword, getMyProfile, updateProfile } from '../../services/api/users';
import { extractApiError, toFormData } from '../../utils/api';

export default function AccountPage() {
  const { updateStoredUser } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    profileImage: null,
    currentPassword: '',
    newPassword: '',
  });
  const [status, setStatus] = useState({
    loading: true,
    saving: false,
    passwordSaving: false,
    error: '',
    success: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getMyProfile();
        const user = data.data.user;
        setForm((prev) => ({
          ...prev,
          fullName: user.fullName || '',
          email: user.email || '',
          phone: user.phone || '',
          whatsappNumber: user.whatsappNumber || '',
        }));
      } catch (error) {
        setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
      } finally {
        setStatus((prev) => ({ ...prev, loading: false }));
      }
    };
    load();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setStatus((prev) => ({ ...prev, saving: true, error: '', success: '' }));
    try {
      const payload = toFormData({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        whatsappNumber: form.whatsappNumber,
        profileImage: form.profileImage,
      });
      const { data } = await updateProfile(payload);
      updateStoredUser(data.data.user);
      setStatus((prev) => ({ ...prev, success: 'تم حفظ التعديلات بنجاح.' }));
      setForm((prev) => ({ ...prev, profileImage: null }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword) return;
    setStatus((prev) => ({ ...prev, passwordSaving: true, error: '', success: '' }));
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setStatus((prev) => ({ ...prev, success: 'تم تغيير كلمة المرور بنجاح.' }));
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    } finally {
      setStatus((prev) => ({ ...prev, passwordSaving: false }));
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader title="أمان الحساب وتعديل البيانات" text="يمكنك تعديل بياناتك مباشرة، وتغيير كلمة المرور باستخدام كلمة المرور الحالية فقط." />
      <Card title="بيانات الحساب الأساسية">
        <form className="form-card" onSubmit={handleSaveProfile}>
          <div className="form-grid">
            <label><span>الاسم</span><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
            <label><span>البريد الإلكتروني</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          </div>
          <div className="form-grid">
            <label><span>الهاتف</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label><span>واتساب</span><input value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} /></label>
          </div>
          <label><span>صورة الحساب</span><input type="file" onChange={(e) => setForm({ ...form, profileImage: e.target.files?.[0] || null })} /></label>
          {status.error ? <p className="error-text">{status.error}</p> : null}
          {status.success ? <p className="success-text">{status.success}</p> : null}
          <div className="header-actions">
            <Button type="submit" disabled={status.loading || status.saving}>{status.saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</Button>
          </div>
        </form>
      </Card>

      <Card title="تغيير كلمة المرور">
        <form className="form-card" onSubmit={handleChangePassword}>
          <div className="form-grid">
            <label><span>كلمة المرور الحالية</span><input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} /></label>
            <label><span>كلمة المرور الجديدة</span><input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} /></label>
          </div>
          <div className="header-actions">
            <Button type="submit" disabled={status.passwordSaving}>{status.passwordSaving ? 'جارٍ التحديث...' : 'تغيير كلمة المرور'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
