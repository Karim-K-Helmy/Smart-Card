import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { deleteUserByAdmin, listUsers, markAdminNotificationAsRead, toggleUserStatus, updateUserByAdmin } from '../../services/api/admin';
import { extractApiError, formatDate } from '../../utils/api';
import { translateDisplayValue } from '../../utils/display';

const BADGE_SYNC_EVENT = 'dashboard-badge-sync';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  whatsappNumber: '',
  currentPlan: 'NONE',
  password: '',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', accountType: '' });
  const [status, setStatus] = useState({ loading: true, error: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [formValues, setFormValues] = useState(initialForm);
  const [modalState, setModalState] = useState({ open: false, saving: false, error: '' });
  const [confirmState, setConfirmState] = useState({ open: false, loading: false, title: '', description: '', action: null });

  const load = async () => {
    setStatus((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const { data } = await listUsers(filters);
      setUsers(data.data.data || []);
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    } finally {
      setStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.allSettled([markAdminNotificationAsRead('users'), load()]);
      window.dispatchEvent(new CustomEvent(BADGE_SYNC_EVENT, { detail: { area: 'admin', key: 'users' } }));
    };

    init();
  }, []);

  const performStatusChange = async (userId, nextStatus) => {
    try {
      await toggleUserStatus(userId, { status: nextStatus, notes: '' });
      await load();
      setConfirmState({ open: false, loading: false, title: '', description: '', action: null });
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
      setConfirmState((prev) => ({ ...prev, loading: false }));
    }
  };

  const requestStatusChange = (user, nextStatus) => {
    setConfirmState({
      open: true,
      loading: false,
      title: nextStatus === 'frozen' ? 'تأكيد تجميد المستخدم' : 'تأكيد إلغاء التجميد',
      description: nextStatus === 'frozen'
        ? `سيتم تجميد حساب ${user.fullName} ومنعه من المتابعة حتى تعيد التفعيل.`
        : `سيتم إعادة تفعيل حساب ${user.fullName} ليعود لاستخدام المنصة بشكل طبيعي.`,
      action: () => performStatusChange(user._id, nextStatus),
    });
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormValues({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      whatsappNumber: user.whatsappNumber || '',
      currentPlan: user.currentPlan || 'NONE',
      password: '',
    });
    setModalState({ open: true, saving: false, error: '' });
  };

  const closeEditModal = () => {
    setModalState({ open: false, saving: false, error: '' });
    setEditingUser(null);
    setFormValues(initialForm);
  };

  const saveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setModalState((prev) => ({ ...prev, saving: true, error: '' }));
    try {
      const payload = {
        fullName: formValues.fullName.trim(),
        email: formValues.email.trim(),
        phone: formValues.phone.trim(),
        whatsappNumber: formValues.whatsappNumber.trim(),
        currentPlan: formValues.currentPlan,
      };

      if (formValues.password.trim()) {
        payload.password = formValues.password.trim();
      }

      await updateUserByAdmin(editingUser._id, payload);
      await load();
      closeEditModal();
    } catch (error) {
      setModalState((prev) => ({ ...prev, saving: false, error: extractApiError(error) }));
    }
  };

  const askRemoveUser = (user) => {
    setConfirmState({
      open: true,
      loading: false,
      title: 'حذف المستخدم نهائيًا',
      description: `سيتم حذف المستخدم ${user.fullName} نهائيًا من قاعدة البيانات. لا يمكن التراجع عن هذا الإجراء.`,
      action: async () => {
        try {
          await deleteUserByAdmin(user._id);
          await load();
          setConfirmState({ open: false, loading: false, title: '', description: '', action: null });
        } catch (error) {
          setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
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

  const userSummary = useMemo(() => {
    if (!editingUser) return [];
    return [
      { label: 'تاريخ الإنشاء', value: formatDate(editingUser.createdAt) },
      { label: 'الباقة الحالية', value: translateDisplayValue(editingUser.currentPlan || 'NONE') },
      { label: 'الهاتف الحالي', value: editingUser.phone || '-' },
      { label: 'واتساب', value: editingUser.whatsappNumber || '-' },
    ];
  }, [editingUser]);

  return (
    <>
      <div className="stack-lg">
        <PageHeader
          title="إدارة المستخدمين"
          text="بحث، فلترة، تعديل بيانات المستخدم من نافذة احترافية كبيرة، مع التحكم في التجميد والحذف من لوحة الأدمن."
          actions={<Button variant="secondary" onClick={load}>تحديث</Button>}
        />
        <Card icon="fa-users">
          <div className="form-grid">
            <label>
              <span>بحث</span>
              <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="ابحث بالاسم أو البريد" />
            </label>
            <label>
              <span>الحالة</span>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">الكل</option>
                <option value="active">active</option>
                <option value="pending">pending</option>
                <option value="frozen">frozen</option>
                <option value="deleted">deleted</option>
              </select>
            </label>
            <label>
              <span>الباقة</span>
              <select value={filters.accountType} onChange={(e) => setFilters({ ...filters, accountType: e.target.value })}>
                <option value="">الكل</option>
                <option value="NONE">None</option>
                <option value="STAR">Star</option>
                <option value="PRO">Pro</option>
              </select>
            </label>
          </div>
          <div className="header-actions">
            <Button onClick={load}>
              <i className="fa-solid fa-check"></i>
              تطبيق الفلاتر
            </Button>
          </div>
        </Card>
        {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}
        <Card icon="fa-users">
          <div className="table-like">
            <div className="table-row table-head admin-users-row">
              <span>الاسم</span><span>البريد الإلكتروني</span><span>الهاتف</span><span>الباقة</span><span>الحالة</span><span>الإجراء</span>
            </div>
            {users.map((user) => (
              <div key={user._id} className="table-row admin-users-row">
                <span>{user.fullName}<br /><small>{formatDate(user.createdAt)}</small></span>
                <span>{user.email}</span>
                <span>{user.phone}</span>
                <span>{translateDisplayValue(user.currentPlan || 'NONE')}</span>
                <span><Badge tone={user.status}>{user.status}</Badge></span>
                <span className="row-actions">
                  <Button variant="ghost" onClick={() => openEditModal(user)}>تعديل</Button>
                  {user.status !== 'frozen'
                    ? <Button variant="secondary" onClick={() => requestStatusChange(user, 'frozen')}>تجميد</Button>
                    : <Button onClick={() => requestStatusChange(user, 'active')}>إلغاء التجميد</Button>}
                  <Button variant="danger" onClick={() => askRemoveUser(user)}>حذف نهائي</Button>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={modalState.open}
        onClose={closeEditModal}
        size="xl"
        title={`تعديل بيانات ${editingUser?.fullName || ''}`}
        description="واجهة كبيرة وحديثة لتحديث البيانات الأساسية للمستخدم بدون نوافذ المتصفح التقليدية."
      >
        <div className="admin-modal-body">
          <aside className="admin-modal-side">
            <div className="admin-modal-profile-card">
              <div className="admin-modal-avatar">{editingUser?.fullName?.charAt(0) || 'U'}</div>
              <h3>{editingUser?.fullName}</h3>
              <p>{editingUser?.email}</p>
              <div className="admin-modal-badges">
                <Badge>{translateDisplayValue(editingUser?.currentPlan || 'NONE')}</Badge>
              </div>
            </div>

            <div className="admin-modal-summary-card">
              {userSummary.map((item) => (
                <div className="admin-summary-item" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </aside>

          <form className="admin-modal-form" onSubmit={saveUser}>
            <div className="admin-modal-grid">
              <label>
                <span>الاسم الكامل</span>
                <input value={formValues.fullName} onChange={(e) => setFormValues((prev) => ({ ...prev, fullName: e.target.value }))} required />
              </label>

              <label>
                <span>البريد الإلكتروني</span>
                <input type="email" value={formValues.email} onChange={(e) => setFormValues((prev) => ({ ...prev, email: e.target.value }))} required />
              </label>

              <label>
                <span>رقم الهاتف</span>
                <input value={formValues.phone} onChange={(e) => setFormValues((prev) => ({ ...prev, phone: e.target.value }))} />
              </label>

              <label>
                <span>رقم واتساب</span>
                <input value={formValues.whatsappNumber} onChange={(e) => setFormValues((prev) => ({ ...prev, whatsappNumber: e.target.value }))} />
              </label>

              <label>
                <span>الباقة الحالية</span>
                <select value={formValues.currentPlan} onChange={(e) => setFormValues((prev) => ({ ...prev, currentPlan: e.target.value }))}>
                  <option value="NONE">None</option>
                  <option value="STAR">Star</option>
                  <option value="PRO">Pro</option>
                </select>
              </label>

              <label>
                <span>كلمة مرور جديدة</span>
                <input
                  type="password"
                  value={formValues.password}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="اتركها فارغة إذا لا تريد تغييرها"
                />
              </label>
            </div>

            {modalState.error ? <p className="error-text">{modalState.error}</p> : null}

            <div className="admin-modal-actions" style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Button type="button" variant="ghost" onClick={closeEditModal} style={{ width: 'fit-content', minWidth: '100px', height: '40px', padding: '0 20px', flex: 'none' }}>إلغاء</Button>
              <Button type="submit" disabled={modalState.saving} style={{ width: 'fit-content', minWidth: '140px', height: '40px', padding: '0 20px', flex: 'none' }}>{modalState.saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</Button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmState.open}
        onClose={() => setConfirmState({ open: false, loading: false, title: '', description: '', action: null })}
        onConfirm={runConfirmAction}
        title={confirmState.title}
        description={confirmState.description}
        loading={confirmState.loading}
        confirmText="تأكيد الإجراء"
      />
    </>
  );
}