import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { deleteUserByAdmin, listUsers, toggleUserStatus, updateUserByAdmin } from '../../services/api/admin';
import { extractApiError, formatDate } from '../../utils/api';
import { translateDisplayValue } from '../../utils/display';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', accountType: '' });
  const [status, setStatus] = useState({ loading: true, error: '' });

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

  useEffect(() => { load(); }, []);

  const updateStatus = async (userId, nextStatus) => {
    try {
      await toggleUserStatus(userId, { status: nextStatus, notes: '' });
      await load();
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    }
  };

  const editUser = async (user) => {
    const fullName = window.prompt('اسم المستخدم', user.fullName || '');
    if (fullName === null) return;
    const email = window.prompt('البريد الإلكتروني', user.email || '');
    if (email === null) return;
    const phone = window.prompt('الهاتف', user.phone || '');
    if (phone === null) return;
    const currentPlan = window.prompt('الخطة الحالية (NONE / STAR / PRO)', user.currentPlan || 'NONE');
    if (currentPlan === null) return;
    try {
      await updateUserByAdmin(user._id, { fullName, email, phone, currentPlan });
      await load();
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    }
  };

  const removeUser = async (user) => {
    if (!window.confirm(`هل تريد حذف المستخدم ${user.fullName}؟`)) return;
    try {
      await deleteUserByAdmin(user._id);
      await load();
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader title="إدارة المستخدمين" text="بحث، فلترة، تعديل، تجميد أو حذف الحسابات من لوحة الأدمن." actions={<Button variant="secondary" onClick={load}>تحديث</Button>} />
      <Card icon="fa-users">
        <div className="form-grid">
          <label><span>بحث</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="ابحث بالاسم أو البريد" /></label>
          <label><span>الباقة</span><select value={filters.accountType} onChange={(e) => setFilters({ ...filters, accountType: e.target.value })}><option value="">الكل</option><option value="STAR">Star</option><option value="PRO">Pro</option></select></label>
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
          <div className="table-row table-head">
            <span>الاسم</span><span>البريد الإلكتروني</span><span>الهاتف</span><span>الباقة</span><span>الحالة</span><span>الإجراء</span>
          </div>
          {users.map((user) => (
            <div key={user._id} className="table-row">
              <span>{user.fullName}<br /><small>{formatDate(user.createdAt)}</small></span>
              <span>{user.email}</span>
              <span>{user.phone}</span>
              <span>{translateDisplayValue(user.currentPlan || 'NONE')}</span>
              <span><Badge tone={user.status}>{user.status}</Badge></span>
              <span className="row-actions">
                <Button variant="ghost" onClick={() => editUser(user)}>تعديل</Button>
                {user.status !== 'frozen' ? <Button variant="secondary" onClick={() => updateStatus(user._id, 'frozen')}>تجميد</Button> : <Button onClick={() => updateStatus(user._id, 'active')}>إلغاء التجميد</Button>}
                <Button variant="danger" onClick={() => removeUser(user)}>حذف</Button>
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
