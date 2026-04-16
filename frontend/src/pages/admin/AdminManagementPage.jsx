import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { createAdminUser, deleteAdminUser, listAdmins, updateAdminUser } from '../../services/api/admin';
import { extractApiError } from '../../utils/api';

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

export default function AdminManagementPage() {
  const { authState } = useAuth();
  const [search, setSearch] = useState('');
  const [admins, setAdmins] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '', success: '' });
  const [adminsStatus, setAdminsStatus] = useState({ saving: false });
  const [adminEditState, setAdminEditState] = useState(initialAdminEditState);
  const [confirmState, setConfirmState] = useState(initialConfirmState);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'admin' });

  const load = async (searchValue = search) => {
    setStatus((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const { data } = await listAdmins(searchValue ? { search: searchValue } : undefined);
      setAdmins(data.data || []);
      setStatus((prev) => ({ ...prev, loading: false, error: '' }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, loading: false, error: extractApiError(error) }));
    }
  };

  useEffect(() => {
    load('');
  }, []);

  const pushSuccess = (message) => setStatus((prev) => ({ ...prev, success: message, error: '' }));
  const pushError = (error) => setStatus((prev) => ({ ...prev, error: extractApiError(error), success: '' }));
  const closeConfirm = () => setConfirmState(initialConfirmState);
  const closeEditAdminModal = () => setAdminEditState(initialAdminEditState);

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
          title="إدارة المشرفين"
          text="إضافة وتعديل وحذف والبحث عن حسابات المشرفين من تبويب مستقل."
          actions={<Button variant="secondary" onClick={() => load()} disabled={status.loading}>تحديث البيانات</Button>}
        />

        {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}
        {status.success ? <Card><p className="success-text">{status.success}</p></Card> : null}

        <Card title="البحث عن المشرفين">
          <div className="row-actions">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو البريد الإلكتروني"
            />
            <Button onClick={() => load(search)} disabled={status.loading}>بحث</Button>
          </div>
        </Card>

        <div className="grid grid-2">
          <Card title="إضافة مشرف جديد">
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
            </div>
          </Card>

          <Card title="قائمة المشرفين">
            <div className="table-like">
              {status.loading ? <p className="muted">جارٍ تحميل المشرفين...</p> : null}
              {!status.loading && !admins.length ? <p className="muted">لا يوجد مشرفون مطابقون للبحث الحالي.</p> : null}
              {admins.map((admin) => (
                <div key={admin._id} className="row-line admin-row-card">
                  <div>
                    <strong>{admin.name}</strong>
                    <p className="muted">{admin.email}</p>
                    {admin.isPrimaryAdmin ? <Badge tone="info">Primary</Badge> : null}
                  </div>
                  <div className="row-actions align-end">
                    <Badge tone="info">{admin.role}</Badge>
                    <Button variant="ghost" onClick={() => openEditAdminModal(admin)} disabled={adminsStatus.saving}>تعديل</Button>
                    {admin._id !== authState.user?._id ? (
                      <Button variant="danger" onClick={() => askRemoveAdmin(admin)} disabled={adminsStatus.saving}>حذف</Button>
                    ) : (
                      <Button variant="secondary" disabled>الحساب الحالي</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={adminEditState.open}
        onClose={closeEditAdminModal}
        size="lg"
        title={`تعديل حساب ${adminEditState.admin?.name || ''}`}
        description="تعديل بيانات المشرف من التبويب المستقل."
        footer={(
          <>
            <Button variant="ghost" onClick={closeEditAdminModal}>إلغاء</Button>
            <Button onClick={submitEditAdmin} disabled={adminEditState.saving}>{adminEditState.saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</Button>
          </>
        )}
      >
        <form className="stack-md" onSubmit={submitEditAdmin}>
          <div className="form-grid">
            <label><span>اسم الأدمن</span><input value={adminEditState.form.name} onChange={(e) => setAdminEditState((prev) => ({ ...prev, form: { ...prev.form, name: e.target.value } }))} /></label>
            <label><span>البريد الإلكتروني</span><input type="email" value={adminEditState.admin?.isPrimaryAdmin ? adminEditState.admin.email || '' : adminEditState.form.email} onChange={(e) => setAdminEditState((prev) => ({ ...prev, form: { ...prev.form, email: e.target.value } }))} disabled={adminEditState.admin?.isPrimaryAdmin} /></label>
          </div>
          <div className="form-grid">
            <label><span>الدور</span><input value={adminEditState.form.role} onChange={(e) => setAdminEditState((prev) => ({ ...prev, form: { ...prev.form, role: e.target.value } }))} /></label>
            <label><span>كلمة مرور جديدة</span><input type="password" value={adminEditState.form.password} onChange={(e) => setAdminEditState((prev) => ({ ...prev, form: { ...prev.form, password: e.target.value } }))} placeholder="اتركها فارغة إذا لا تريد التغيير" /></label>
          </div>
          {adminEditState.error ? <p className="error-text">{adminEditState.error}</p> : null}
        </form>
      </Modal>

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
