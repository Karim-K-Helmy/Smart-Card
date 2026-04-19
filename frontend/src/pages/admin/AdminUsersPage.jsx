import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { deleteUserByAdmin, listUsers, markAdminNotificationAsRead, toggleUserStatus, updateUserByAdmin } from '../../services/api/admin';
import { extractApiError, formatDate, toFormData } from '../../utils/api';
import { translateDisplayValue } from '../../utils/display';

const BADGE_SYNC_EVENT = 'dashboard-badge-sync';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  whatsappNumber: '',
  currentPlan: 'NONE',
  password: '',
  profileImage: null,
  removeProfileImage: false,
};

const getUserImage = (user) => user?.profileImage || user?.avatarUrl || '';

const getInitials = (name) =>
  String(name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

function ActionIconButton({ icon, label, variant = 'ghost', className = '', ...props }) {
  return (
    <Button
      variant={variant}
      className={`icon-action-btn ${className}`.trim()}
      title={label}
      aria-label={label}
      {...props}
    >
      <i className={`fa-solid ${icon}`} aria-hidden="true"></i>
    </Button>
  );
}

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
      profileImage: null,
      removeProfileImage: false,
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
      const payload = toFormData({
        fullName: formValues.fullName.trim(),
        email: formValues.email.trim(),
        phone: formValues.phone.trim(),
        whatsappNumber: formValues.whatsappNumber.trim(),
        currentPlan: formValues.currentPlan,
        password: formValues.password.trim(),
        profileImage: formValues.profileImage,
        removeProfileImage: formValues.removeProfileImage,
      });

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

  const profilePreview = useMemo(() => {
    if (formValues.profileImage) return URL.createObjectURL(formValues.profileImage);
    if (formValues.removeProfileImage) return '';
    return getUserImage(editingUser);
  }, [formValues.profileImage, formValues.removeProfileImage, editingUser]);

  useEffect(() => () => {
    if (profilePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(profilePreview);
    }
  }, [profilePreview]);

  return (
    <>
      <div className="stack-lg">
        <PageHeader
          title="إدارة المستخدمين"
          text="بحث وفلترة وتعديل بيانات المستخدمين من واجهة حديثة، مع إدارة التجميد والحذف والصورة الشخصية مباشرة من لوحة الأدمن."
          actions={<Button variant="secondary" onClick={load}>تحديث</Button>}
        />
        <Card icon="fa-users" className="admin-users-filters-card">
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
          <div className="header-actions admin-users-filters-actions">
            <Button onClick={load}>
              <i className="fa-solid fa-check"></i>
              تطبيق الفلاتر
            </Button>
          </div>
        </Card>
        {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}
        <Card icon="fa-users" className="admin-users-table-card">
          <div className="table-like admin-users-table">
            <div className="table-row table-head admin-users-row">
              <span>المستخدم</span><span>التواصل</span><span>الهاتف</span><span>الباقة</span><span>الحالة</span><span>الإجراءات</span>
            </div>
            {users.map((user) => (
              <div key={user._id} className="table-row admin-users-row admin-user-card-row">
                <span data-label="المستخدم" className="admin-user-identity-cell">
                  <span className="admin-user-identity">
                    {getUserImage(user) ? (
                      <img src={getUserImage(user)} alt={user.fullName} className="admin-user-mini-avatar" />
                    ) : (
                      <span className="admin-user-mini-avatar admin-user-mini-avatar-fallback">{getInitials(user.fullName)}</span>
                    )}
                    <span>
                      <strong>{user.fullName}</strong>
                      <small>{formatDate(user.createdAt)}</small>
                    </span>
                  </span>
                </span>
                <span data-label="التواصل">
                  <strong>{user.email}</strong>
                  <small>{user.whatsappNumber || 'بدون واتساب'}</small>
                </span>
                <span data-label="الهاتف">{user.phone}</span>
                <span data-label="الباقة"><Badge>{translateDisplayValue(user.currentPlan || 'NONE')}</Badge></span>
                <span data-label="الحالة"><Badge tone={user.status}>{user.status}</Badge></span>
                <span data-label="الإجراءات" className="row-actions admin-users-actions">
                  <ActionIconButton icon="fa-pen-to-square" label="تعديل المستخدم" onClick={() => openEditModal(user)} />
                  {user.status !== 'frozen'
                    ? <ActionIconButton icon="fa-user-lock" label="تجميد المستخدم" variant="secondary" onClick={() => requestStatusChange(user, 'frozen')} />
                    : <ActionIconButton icon="fa-lock-open" label="إلغاء التجميد" onClick={() => requestStatusChange(user, 'active')} />}
                  <ActionIconButton icon="fa-trash-can" label="حذف نهائي" variant="danger" onClick={() => askRemoveUser(user)} />
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
        description="تحديث البيانات الأساسية والصورة الشخصية للمستخدم من نافذة إدارة حديثة." 
      >
        <div className="admin-modal-body">
          <aside className="admin-modal-side">
            <div className="admin-modal-profile-card">
              {profilePreview ? (
                <img className="admin-modal-avatar-image" src={profilePreview} alt={editingUser?.fullName} />
              ) : (
                <div className="admin-modal-avatar">{getInitials(editingUser?.fullName)}</div>
              )}
              <h3>{editingUser?.fullName}</h3>
              <p>{editingUser?.email}</p>
              <div className="admin-modal-badges">
                <Badge>{translateDisplayValue(editingUser?.currentPlan || 'NONE')}</Badge>
                <Badge tone={editingUser?.status}>{editingUser?.status || 'pending'}</Badge>
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
                <input value={formValues.fullName} onChange={(e) => setFormValues((prev) => ({ ...prev, fullName: e.target.value }))} />
              </label>
              <label>
                <span>البريد الإلكتروني</span>
                <input type="email" value={formValues.email} onChange={(e) => setFormValues((prev) => ({ ...prev, email: e.target.value }))} />
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
                <input type="password" value={formValues.password} onChange={(e) => setFormValues((prev) => ({ ...prev, password: e.target.value }))} placeholder="اتركها فارغة إذا لا تريد التغيير" />
              </label>
              <label className="admin-modal-grid-full">
                <span>الصورة الشخصية</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormValues((prev) => ({
                    ...prev,
                    profileImage: e.target.files?.[0] || null,
                    removeProfileImage: false,
                  }))}
                />
              </label>
              <label className="checkbox-line admin-check admin-modal-grid-full">
                <input
                  type="checkbox"
                  checked={formValues.removeProfileImage}
                  onChange={(e) => setFormValues((prev) => ({
                    ...prev,
                    removeProfileImage: e.target.checked,
                    profileImage: e.target.checked ? null : prev.profileImage,
                  }))}
                />
                إزالة الصورة الحالية
              </label>
            </div>
            {modalState.error ? <p className="error-text">{modalState.error}</p> : null}
            <div className="admin-modal-actions">
              <Button type="button" variant="ghost" size="sm" onClick={closeEditModal}>إلغاء</Button>
              <Button type="submit" size="sm" disabled={modalState.saving}>{modalState.saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</Button>
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
      />
    </>
  );
}
