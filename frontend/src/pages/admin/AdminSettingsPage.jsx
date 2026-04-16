import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import {
  createAdminUser,
  deleteAdminUser,
  getAdminMe,
  listAdmins,
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

const initialAdminEditState = {
  open: false,
  saving: false,
  error: '',
  admin: null,
  form: { name: '', email: '', role: 'admin', password: '' },
};

const initialConfirmState = {
  open: false,
  loading: false,
  title: '',
  description: '',
  action: null,
  confirmText: 'تأكيد',
};

export default function AdminSettingsPage() {
  const { authState, updateStoredUser } = useAuth();
  const [status, setStatus] = useState({ loading: true, error: '', success: '' });
  const [profileStatus, setProfileStatus] = useState({ saving: false });
  const [methodsStatus, setMethodsStatus] = useState({ saving: false });
  const [plansStatus, setPlansStatus] = useState({ savingId: '' });
  const [adminsStatus, setAdminsStatus] = useState({ saving: false });
  const [adminEditState, setAdminEditState] = useState(initialAdminEditState);
  const [confirmState, setConfirmState] = useState(initialConfirmState);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
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
  const isSuperAdmin = Boolean(authState.user?.isPrimaryAdmin);

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

  const closeConfirm = () => setConfirmState(initialConfirmState);

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileStatus((prev) => ({ ...prev, saving: true }));
    try {
      const payload = toFormData({
        name: profile.name,
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

  const askRemoveMethod = (method) => {
    setConfirmState({
      open: true,
      loading: false,
      title: 'حذف وسيلة الدفع',
      description: `سيتم حذف وسيلة الدفع ${method.methodName} من النظام نهائيًا.`,
      confirmText: 'حذف الوسيلة',
      action: async () => {
        try {
          await deletePaymentMethod(method._id);
          pushSuccess(`تم حذف ${method.methodName}.`);
          await load();
          closeConfirm();
        } catch (error) {
          pushError(error);
          setConfirmState((prev) => ({ ...prev, loading: false }));
        }
      },
    });
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

  const openEditAdminModal = (admin) => {
    setAdminEditState({
      open: true,
      saving: false,
      error: '',
      admin,
      form: {
        name: admin.name || '',
        email: admin.email || '',
        role: admin.role || 'admin',
        password: '',
      },
    });
  };

  const closeEditAdminModal = () => setAdminEditState(initialAdminEditState);

  const submitEditAdmin = async (event) => {
    event.preventDefault();
    const { admin, form } = adminEditState;
    if (!admin) return;

    setAdminEditState((prev) => ({ ...prev, saving: true, error: '' }));
    try {
      await updateAdminUser(admin._id, {
        name: form.name,
        email: admin.isPrimaryAdmin ? admin.email : form.email,
        role: form.role,
        ...(form.password ? { password: form.password } : {}),
      });
      pushSuccess(`تم تعديل الأدمن ${form.name}.`);
      await load();
      closeEditAdminModal();
    } catch (error) {
      setAdminEditState((prev) => ({ ...prev, saving: false, error: extractApiError(error) }));
    }
  };

  const askRemoveAdmin = (admin) => {
    setConfirmState({
      open: true,
      loading: false,
      title: 'حذف حساب الأدمن',
      description: `سيتم حذف حساب ${admin.name} نهائيًا من لوحة الإدارة.`,
      confirmText: 'حذف الأدمن',
      action: async () => {
        try {
          await deleteAdminUser(admin._id);
          pushSuccess(`تم حذف الأدمن ${admin.name}.`);
          await load();
          closeConfirm();
        } catch (error) {
          pushError(error);
          setConfirmState((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const runConfirmAction = async () => {
    if (!confirmState.action) return;
    setConfirmState((prev) => ({ ...prev, loading: true }));
    await confirmState.action();
  };

  return (
    <>
      <div className="stack-lg">
        <PageHeader
          title="إعدادات الأدمن"
          text="إدارة ملف الأدمن، تسعير باقتي Star وPro، ووسائل الدفع من شاشة واحدة."
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
                </div>
              </div>

              <form className="form-card" onSubmit={saveProfile}>
                <div className="form-grid">
                  <label><span>اسم الأدمن</span><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
                  <label><span>البريد الأساسي (ثابت من .env)</span><input type="email" value={profile.email} readOnly disabled /></label>
                </div>
                <label><span>صورة الأدمن</span><input type="file" accept="image/*" onChange={(e) => setProfile({ ...profile, avatar: e.target.files?.[0] || null })} /></label>
                <label><span>كلمة المرور الحالية</span><input type="password" value={profile.currentPassword} onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })} placeholder="مطلوبة عند تغيير كلمة المرور" /></label>
                <label><span>كلمة مرور جديدة</span><input type="password" value={profile.newPassword} onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })} placeholder="اتركها فارغة إذا لا تريد التغيير" /></label>
                <div className="header-actions">
                  <Button type="submit" disabled={profileStatus.saving}>{profileStatus.saving ? 'جارٍ الحفظ...' : 'حفظ الملف الشخصي'}</Button>
                </div>
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
                      <Button variant="danger" onClick={() => askRemoveMethod(method)} disabled={methodsStatus.saving}>حذف</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

        </div>
      </div>

      <ConfirmDialog
        open={confirmState.open}
        onClose={closeConfirm}
        onConfirm={runConfirmAction}
        title={confirmState.title}
        description={confirmState.description}
        loading={confirmState.loading}
        confirmText={confirmState.confirmText}
      />
    </>
  );
}
