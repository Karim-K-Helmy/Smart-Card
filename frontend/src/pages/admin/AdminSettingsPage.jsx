import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import {
  createAdminUser,
  deleteAdminUser,
  getAdminMe,
  listAdmins,
  requestAdminProfileOtp,
  updateAdminMe,
  updateAdminUser,
} from '../../services/api/admin';
import { getCardPlans, updateCardPlan } from '../../services/api/cards';
import {
  createPaymentMethod,
  deletePaymentMethod,
  listAdminPaymentMethods,
  updatePaymentMethod,
} from '../../services/api/payments';
import { extractApiError, formatMoney, toFormData } from '../../utils/api';

const planOrder = { STAR: 1, PRO: 2 };

const getInitials = (name) =>
  String(name || 'AD')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const normalizePlan = (plan) => ({
  _id: plan._id,
  name: plan.name || '',
  planCode: plan.planCode || '',
  description: plan.description || '',
  price: String(plan.price ?? ''),
  durationDays: String(plan.durationDays ?? ''),
  isActive: Boolean(plan.isActive),
  featuresText: Array.isArray(plan.features) ? plan.features.join('\n') : '',
});

const mapMethodPayload = (method) => ({
  methodName: method.methodName,
  phoneNumber: method.phoneNumber,
  accountName: method.accountName,
  instructions: method.instructions,
  isActive: Boolean(method.isActive),
});

export default function AdminSettingsPage() {
  const { authState, updateStoredUser } = useAuth();
  const [status, setStatus] = useState({ loading: true, error: '', success: '' });
  const [profileStatus, setProfileStatus] = useState({ otp: '', saving: false });
  const [methodsStatus, setMethodsStatus] = useState({ saving: false });
  const [plansStatus, setPlansStatus] = useState({ savingId: '' });
  const [adminsStatus, setAdminsStatus] = useState({ saving: false });

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    otpCode: '',
    currentPassword: '',
    newPassword: '',
    avatar: null,
    avatarUrl: '',
  });
  const [plans, setPlans] = useState([]);
  const [methods, setMethods] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [newMethod, setNewMethod] = useState({
    methodName: '',
    phoneNumber: '',
    accountName: '',
    instructions: '',
    isActive: true,
  });
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
  });

  const load = async () => {
    setStatus({ loading: true, error: '', success: '' });
    try {
      const [meRes, plansRes, methodsRes, adminsRes] = await Promise.all([
        getAdminMe(),
        getCardPlans(),
        listAdminPaymentMethods(),
        listAdmins(),
      ]);

      const adminData = meRes.data.data || {};
      setProfile((prev) => ({
        ...prev,
        name: adminData.name || '',
        email: adminData.primaryEmail || adminData.email || '',
        avatarUrl: adminData.avatarUrl || '',
        avatar: null,
        otpCode: '',
        currentPassword: '',
        newPassword: '',
      }));

      const fetchedPlans = (plansRes.data.data || [])
        .filter((plan) => ['STAR', 'PRO'].includes(plan.planCode))
        .sort((a, b) => (planOrder[a.planCode] || 99) - (planOrder[b.planCode] || 99))
        .map(normalizePlan);

      setPlans(fetchedPlans);
      setMethods((methodsRes.data.data || []).map((method) => ({ ...method })));
      setAdmins((adminsRes.data.data || []).map((admin) => ({ ...admin })));
      setStatus({ loading: false, error: '', success: '' });
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error), success: '' });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const avatarPreview = useMemo(() => {
    if (profile.avatar) return URL.createObjectURL(profile.avatar);
    return profile.avatarUrl || '';
  }, [profile.avatar, profile.avatarUrl]);

  useEffect(() => () => {
    if (profile.avatar && avatarPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
  }, [profile.avatar, avatarPreview]);

  const pushSuccess = (message) => setStatus((prev) => ({ ...prev, success: message, error: '' }));
  const pushError = (error) => setStatus((prev) => ({ ...prev, error: extractApiError(error), success: '' }));

  const sendProfileOtp = async () => {
    setProfileStatus((prev) => ({ ...prev, otp: '' }));
    try {
      const { data } = await requestAdminProfileOtp();
      const devCode = data.data?.devCode;
      const message = devCode
        ? `تم إرسال كود تغيير كلمة المرور. كود التطوير الحالي: ${devCode}`
        : 'تم إرسال كود تغيير كلمة المرور إلى بريد الأدمن الأساسي.';
      setProfileStatus((prev) => ({ ...prev, otp: message }));
      pushSuccess(message);
    } catch (error) {
      pushError(error);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileStatus((prev) => ({ ...prev, saving: true }));
    try {
      const payload = toFormData({
        name: profile.name,
        otpCode: profile.otpCode,
        currentPassword: profile.currentPassword,
        newPassword: profile.newPassword,
        avatar: profile.avatar,
      });
      const { data } = await updateAdminMe(payload);
      const adminData = data.data || {};
      setProfile((prev) => ({
        ...prev,
        avatar: null,
        avatarUrl: adminData.avatarUrl || prev.avatarUrl,
        otpCode: '',
        currentPassword: '',
        newPassword: '',
      }));
      updateStoredUser(adminData);
      pushSuccess('تم تحديث ملف الأدمن بنجاح.');
    } catch (error) {
      pushError(error);
    } finally {
      setProfileStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  const updatePlanField = (planId, key, value) => {
    setPlans((prev) => prev.map((plan) => (plan._id === planId ? { ...plan, [key]: value } : plan)));
  };

  const savePlan = async (plan) => {
    setPlansStatus({ savingId: plan._id });
    try {
      await updateCardPlan(plan._id, {
        name: plan.name,
        description: plan.description,
        price: Number(plan.price || 0),
        durationDays: Number(plan.durationDays || 0),
        features: plan.featuresText
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        isActive: true,
      });
      pushSuccess(`تم تحديث تسعير وبيانات باقة ${plan.name}.`);
      await load();
    } catch (error) {
      pushError(error);
    } finally {
      setPlansStatus({ savingId: '' });
    }
  };

  const updateMethodField = (methodId, key, value) => {
    setMethods((prev) => prev.map((method) => (method._id === methodId ? { ...method, [key]: value } : method)));
  };

  const saveMethod = async (method) => {
    setMethodsStatus({ saving: true });
    try {
      await updatePaymentMethod(method._id, mapMethodPayload(method));
      pushSuccess(`تم تحديث وسيلة الدفع ${method.methodName}.`);
      await load();
    } catch (error) {
      pushError(error);
    } finally {
      setMethodsStatus({ saving: false });
    }
  };

  const createMethodHandler = async (event) => {
    event.preventDefault();
    setMethodsStatus({ saving: true });
    try {
      await createPaymentMethod(mapMethodPayload(newMethod));
      setNewMethod({ methodName: '', phoneNumber: '', accountName: '', instructions: '', isActive: true });
      pushSuccess('تمت إضافة وسيلة الدفع بنجاح.');
      await load();
    } catch (error) {
      pushError(error);
    } finally {
      setMethodsStatus({ saving: false });
    }
  };

  const removeMethod = async (method) => {
    if (!window.confirm(`هل تريد حذف وسيلة الدفع ${method.methodName}؟`)) return;
    setMethodsStatus({ saving: true });
    try {
      await deletePaymentMethod(method._id);
      pushSuccess(`تم حذف ${method.methodName}.`);
      await load();
    } catch (error) {
      pushError(error);
    } finally {
      setMethodsStatus({ saving: false });
    }
  };

  const createAdminHandler = async (event) => {
    event.preventDefault();
    setAdminsStatus({ saving: true });
    try {
      await createAdminUser(newAdmin);
      setNewAdmin({ name: '', email: '', password: '', role: 'admin' });
      pushSuccess('تمت إضافة حساب أدمن جديد.');
      await load();
    } catch (error) {
      pushError(error);
    } finally {
      setAdminsStatus({ saving: false });
    }
  };

  const editAdmin = async (admin) => {
    const name = window.prompt('اسم الأدمن', admin.name || '');
    if (name === null) return;
    const email = admin.isPrimaryAdmin ? admin.email : window.prompt('البريد الإلكتروني', admin.email || '');
    if (email === null) return;
    const role = window.prompt('الدور', admin.role || 'admin');
    if (role === null) return;
    const password = window.prompt('كلمة مرور جديدة (اتركها فارغة إذا لا تريد التغيير)', '');
    if (password === null) return;

    setAdminsStatus({ saving: true });
    try {
      await updateAdminUser(admin._id, {
        name,
        email,
        role,
        ...(password ? { password } : {}),
      });
      pushSuccess(`تم تعديل الأدمن ${name}.`);
      await load();
    } catch (error) {
      pushError(error);
    } finally {
      setAdminsStatus({ saving: false });
    }
  };

  const removeAdmin = async (admin) => {
    if (!window.confirm(`هل تريد حذف الأدمن ${admin.name}؟`)) return;
    setAdminsStatus({ saving: true });
    try {
      await deleteAdminUser(admin._id);
      pushSuccess(`تم حذف الأدمن ${admin.name}.`);
      await load();
    } catch (error) {
      pushError(error);
    } finally {
      setAdminsStatus({ saving: false });
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader
        title="إعدادات الأدمن"
        text="إدارة ملف الأدمن، تسعير باقتي Star وPro، وسائل الدفع، وحسابات الأدمن من شاشة واحدة حقيقية."
        actions={<Button variant="secondary" onClick={load} disabled={status.loading}>تحديث البيانات</Button>}
      />

      {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}
      {status.success ? <Card><p className="success-text">{status.success}</p></Card> : null}

      <div className="grid grid-2">
        <Card title="ملف الأدمن الشخصي">
          <div className="stack-md">
            <div className="account-hero">
              {avatarPreview ? (
                <img className="profile-avatar large avatar-image" src={avatarPreview} alt={profile.name || authState.user?.fullName} />
              ) : (
                <div className="profile-avatar large">{getInitials(profile.name || authState.user?.fullName)}</div>
              )}
              <div>
                <strong>{profile.name || 'Admin'}</strong>
                <p className="muted">{profile.email || '-'}</p>
                <Badge tone="info">OTP مطلوب فقط عند تغيير كلمة المرور</Badge>
              </div>
            </div>

            <form className="form-card" onSubmit={saveProfile}>
              <div className="form-grid">
                <label><span>اسم الأدمن</span><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
                <label><span>البريد الأساسي (ثابت من .env)</span><input type="email" value={profile.email} readOnly disabled /></label>
              </div>
              <label><span>صورة الأدمن</span><input type="file" accept="image/*" onChange={(e) => setProfile({ ...profile, avatar: e.target.files?.[0] || null })} /></label>
              <div className="form-grid">
                <label><span>كود التأكيد OTP</span><input value={profile.otpCode} onChange={(e) => setProfile({ ...profile, otpCode: e.target.value })} placeholder="أدخله فقط عند تغيير كلمة المرور" /></label>
                <label><span>كلمة المرور الحالية</span><input type="password" value={profile.currentPassword} onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })} placeholder="مطلوبة عند تغيير كلمة المرور" /></label>
              </div>
              <label><span>كلمة مرور جديدة</span><input type="password" value={profile.newPassword} onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })} placeholder="اتركها فارغة إذا لا تريد التغيير" /></label>
              <div className="header-actions">
                <Button type="button" variant="secondary" onClick={sendProfileOtp}>إرسال OTP لكلمة المرور</Button>
                <Button type="submit" disabled={profileStatus.saving}>{profileStatus.saving ? 'جارٍ الحفظ...' : 'حفظ الملف الشخصي'}</Button>
              </div>
              {profileStatus.otp ? <p className="success-text">{profileStatus.otp}</p> : null}
            </form>
          </div>
        </Card>

        <Card title="تسعير الباقات الحقيقية">
          <div className="stack-md">
            <div className="notice-card notice-info">
              <strong>مهم</strong>
              <p>النظام الآن يحتوي على باقتين فقط: Star وPro، ويعتمد بالكامل على بيانات حقيقية من الخادم.</p>
            </div>
            {plans.map((plan) => (
              <div key={plan._id} className="settings-block">
                <div className="plan-settings-head">
                  <div>
                    <strong>{plan.planCode}</strong>
                    <p className="muted">{plan.name}</p>
                  </div>
                  <Badge tone={plan.isActive ? 'success' : 'warning'}>{plan.isActive ? 'active' : 'inactive'}</Badge>
                </div>
                <div className="form-grid">
                  <label><span>اسم الباقة</span><input value={plan.name} onChange={(e) => updatePlanField(plan._id, 'name', e.target.value)} /></label>
                  <label><span>السعر</span><input type="number" min="0" value={plan.price} onChange={(e) => updatePlanField(plan._id, 'price', e.target.value)} /></label>
                </div>
                <div className="form-grid">
                  <label><span>مدة الصلاحية بالأيام</span><input type="number" min="0" value={plan.durationDays} onChange={(e) => updatePlanField(plan._id, 'durationDays', e.target.value)} /></label>
                  <label><span>الوصف</span><input value={plan.description} onChange={(e) => updatePlanField(plan._id, 'description', e.target.value)} /></label>
                </div>
                <label><span>المميزات (كل سطر ميزة)</span><textarea rows="4" value={plan.featuresText} onChange={(e) => updatePlanField(plan._id, 'featuresText', e.target.value)} /></label>
                <div className="row-line compact-row-line">
                  <strong>المعاينة الحالية</strong>
                  <span>{Number(plan.price) > 0 ? formatMoney(plan.price) : 'بدون سعر ظاهر'} {Number(plan.durationDays) > 0 ? `/ ${plan.durationDays} يوم` : ''}</span>
                </div>
                <Button onClick={() => savePlan(plan)} disabled={plansStatus.savingId === plan._id}>
                  {plansStatus.savingId === plan._id ? 'جارٍ حفظ الباقة...' : `حفظ ${plan.planCode}`}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-2">
        <Card title="إدارة وسائل الدفع">
          <div className="stack-md">
            <form className="form-card" onSubmit={createMethodHandler}>
              <div className="form-grid">
                <label><span>اسم الوسيلة</span><input required value={newMethod.methodName} onChange={(e) => setNewMethod({ ...newMethod, methodName: e.target.value })} /></label>
                <label><span>رقم الهاتف</span><input value={newMethod.phoneNumber} onChange={(e) => setNewMethod({ ...newMethod, phoneNumber: e.target.value })} /></label>
              </div>
              <div className="form-grid">
                <label><span>اسم المستلم</span><input value={newMethod.accountName} onChange={(e) => setNewMethod({ ...newMethod, accountName: e.target.value })} /></label>
                <label className="checkbox-line admin-check"><input type="checkbox" checked={newMethod.isActive} onChange={(e) => setNewMethod({ ...newMethod, isActive: e.target.checked })} /> تفعيل الوسيلة</label>
              </div>
              <label><span>التعليمات</span><textarea rows="3" value={newMethod.instructions} onChange={(e) => setNewMethod({ ...newMethod, instructions: e.target.value })} /></label>
              <Button type="submit" disabled={methodsStatus.saving}>{methodsStatus.saving ? 'جارٍ الإضافة...' : 'إضافة وسيلة دفع'}</Button>
            </form>

            <div className="table-like">
              {methods.map((method) => (
                <div key={method._id} className="settings-block">
                  <div className="plan-settings-head">
                    <strong>{method.methodName}</strong>
                    <Badge tone={method.isActive ? 'success' : 'warning'}>{method.isActive ? 'active' : 'inactive'}</Badge>
                  </div>
                  <div className="form-grid">
                    <label><span>اسم الوسيلة</span><input value={method.methodName || ''} onChange={(e) => updateMethodField(method._id, 'methodName', e.target.value)} /></label>
                    <label><span>رقم الهاتف</span><input value={method.phoneNumber || ''} onChange={(e) => updateMethodField(method._id, 'phoneNumber', e.target.value)} /></label>
                  </div>
                  <div className="form-grid">
                    <label><span>اسم المستلم</span><input value={method.accountName || ''} onChange={(e) => updateMethodField(method._id, 'accountName', e.target.value)} /></label>
                    <label className="checkbox-line admin-check"><input type="checkbox" checked={Boolean(method.isActive)} onChange={(e) => updateMethodField(method._id, 'isActive', e.target.checked)} /> تفعيل الوسيلة</label>
                  </div>
                  <label><span>التعليمات</span><textarea rows="3" value={method.instructions || ''} onChange={(e) => updateMethodField(method._id, 'instructions', e.target.value)} /></label>
                  <div className="row-actions">
                    <Button onClick={() => saveMethod(method)} disabled={methodsStatus.saving}>حفظ التعديلات</Button>
                    <Button variant="danger" onClick={() => removeMethod(method)} disabled={methodsStatus.saving}>حذف</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="إدارة حسابات الأدمن">
          <div className="stack-md">
            <form className="form-card" onSubmit={createAdminHandler}>
              <div className="form-grid">
                <label><span>الاسم</span><input required value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} /></label>
                <label><span>البريد</span><input required type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} /></label>
              </div>
              <div className="form-grid">
                <label><span>كلمة المرور</span><input required type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} /></label>
                <label><span>الدور</span><input value={newAdmin.role} onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })} /></label>
              </div>
              <Button type="submit" disabled={adminsStatus.saving}>{adminsStatus.saving ? 'جارٍ الإنشاء...' : 'إضافة أدمن جديد'}</Button>
            </form>

            <div className="table-like">
              {admins.map((admin) => (
                <div key={admin._id} className="row-line admin-row-card">
                  <div>
                    <strong>{admin.name}</strong>
                    <p className="muted">{admin.email}</p>{admin.isPrimaryAdmin ? <Badge tone="info">Primary</Badge> : null}
                  </div>
                  <div className="row-actions align-end">
                    <Badge tone="info">{admin.role}</Badge>
                    <Button variant="ghost" onClick={() => editAdmin(admin)} disabled={adminsStatus.saving}>تعديل</Button>
                    {admin._id !== authState.user?._id ? (
                      <Button variant="danger" onClick={() => removeAdmin(admin)} disabled={adminsStatus.saving}>حذف</Button>
                    ) : (
                      <Button variant="secondary" disabled>الحساب الحالي</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
