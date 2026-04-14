import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { changePassword, getMyProfile, requestUserOtp, updateProfile } from '../../services/api/users';
import { extractApiError, toFormData } from '../../utils/api';

export default function AccountPage() {
  const { updateStoredUser } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    bio: '',
    profileImage: null,
    profileOtpCode: '',
    currentPassword: '',
    newPassword: '',
    passwordOtpCode: '',
  });
  const [status, setStatus] = useState({
    loading: true,
    saving: false,
    passwordSaving: false,
    otpLoading: '',
    error: '',
    success: '',
    devCode: '',
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
          bio: user.bio || '',
        }));
      } catch (error) {
        setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
      } finally {
        setStatus((prev) => ({ ...prev, loading: false }));
      }
    };
    load();
  }, []);

  const sendOtp = async (purpose) => {
    setStatus((prev) => ({ ...prev, otpLoading: purpose, error: '', success: '', devCode: '' }));
    try {
      const { data } = await requestUserOtp({ purpose });
      setStatus((prev) => ({
        ...prev,
        otpLoading: '',
        success: purpose === 'change_password' ? 'تم إرسال كود تغيير كلمة المرور.' : 'تم إرسال كود تأكيد تعديل البيانات.',
        devCode: data.data?.devCode || '',
      }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, otpLoading: '', error: extractApiError(error) }));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setStatus((prev) => ({ ...prev, saving: true, error: '', success: '' }));
    try {
      const payload = toFormData({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        whatsappNumber: form.whatsappNumber,
        bio: form.bio,
        profileImage: form.profileImage,
        otpCode: form.profileOtpCode,
      });
      const { data } = await updateProfile(payload);
      updateStoredUser(data.data.user);
      setStatus((prev) => ({ ...prev, success: 'تم حفظ التعديلات بنجاح.', devCode: '' }));
      setForm((prev) => ({ ...prev, profileImage: null, profileOtpCode: '' }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.passwordOtpCode) return;
    setStatus((prev) => ({ ...prev, passwordSaving: true, error: '', success: '' }));
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword, otpCode: form.passwordOtpCode });
      setStatus((prev) => ({ ...prev, success: 'تم تغيير كلمة المرور بنجاح.', devCode: '' }));
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '', passwordOtpCode: '' }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    } finally {
      setStatus((prev) => ({ ...prev, passwordSaving: false }));
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader title="أمان الحساب وتعديل البيانات" text="قبل حفظ أي تعديل حساس أو تغيير كلمة المرور، اطلب كود تأكيد من البريد الإلكتروني ثم أدخله هنا." />
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
          <div className="form-grid">
            <label><span>صورة الحساب</span><input type="file" onChange={(e) => setForm({ ...form, profileImage: e.target.files?.[0] || null })} /></label>
            <label><span>كود التأكيد</span><input value={form.profileOtpCode} onChange={(e) => setForm({ ...form, profileOtpCode: e.target.value })} placeholder="أدخل الكود بعد إرساله" /></label>
          </div>
          <label><span>نبذة مختصرة</span><textarea rows="4" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></label>
          {status.devCode ? <p className="muted">كود التطوير الحالي: <strong>{status.devCode}</strong></p> : null}
          {status.error ? <p className="error-text">{status.error}</p> : null}
          {status.success ? <p className="success-text">{status.success}</p> : null}
          <div className="header-actions">
            <Button type="button" variant="ghost" onClick={() => sendOtp('update_profile')} disabled={status.otpLoading === 'update_profile'}>
              {status.otpLoading === 'update_profile' ? 'جارٍ إرسال الكود...' : 'إرسال كود تأكيد البيانات'}
            </Button>
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
          <label><span>كود التحقق</span><input value={form.passwordOtpCode} onChange={(e) => setForm({ ...form, passwordOtpCode: e.target.value })} placeholder="أدخل كود تغيير كلمة المرور" /></label>
          <div className="header-actions">
            <Button type="button" variant="ghost" onClick={() => sendOtp('change_password')} disabled={status.otpLoading === 'change_password'}>
              {status.otpLoading === 'change_password' ? 'جارٍ إرسال الكود...' : 'إرسال كود تغيير كلمة المرور'}
            </Button>
            <Button type="submit" disabled={status.passwordSaving}>{status.passwordSaving ? 'جارٍ التحديث...' : 'تغيير كلمة المرور'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
