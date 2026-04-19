import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { listCards, toggleCardStatus } from '../../services/api/admin';
import { extractApiError, formatDate } from '../../utils/api';

export default function AdminCardsPage() {
  const [cards, setCards] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '', actionLoading: false });
  const [pendingCard, setPendingCard] = useState(null);

  const load = async () => {
    try {
      const { data } = await listCards();
      setCards(data.data.data || []);
      setStatus((prev) => ({ ...prev, loading: false, error: '' }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, loading: false, error: extractApiError(error) }));
    }
  };

  useEffect(() => { load(); }, []);

  const requestToggle = (card) => setPendingCard(card);

  const handleToggle = async () => {
    if (!pendingCard) return;

    try {
      setStatus((prev) => ({ ...prev, actionLoading: true, error: '' }));
      await toggleCardStatus(pendingCard._id, { isActive: !pendingCard.isActive });
      setPendingCard(null);
      await load();
    } catch (error) {
      setStatus((prev) => ({ ...prev, actionLoading: false, error: extractApiError(error) }));
    } finally {
      setStatus((prev) => ({ ...prev, actionLoading: false }));
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader title="إدارة البطاقات" text="يمكن للإدارة إيقاف أو تفعيل البطاقة، وعند إيقافها يتم حجب صفحة الملف الشخصي العامة بالكامل وإرسال إشعار واضح لصاحب البطاقة داخل لوحة المستخدم." />
      {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}
      <Card>
        <div className="table-like">
          <div className="table-row table-head"><span>المالك</span><span>الكود</span><span>الرابط</span><span>الحالة</span><span>الإجراء</span><span>تاريخ التفعيل</span></div>
          {cards.map((card) => (
            <div key={card._id} className="table-row">
              <span>{card.userId?.fullName || '-'}</span>
              <span>{card.cardCode || '-'}</span>
              <span>{card.shortLink || '-'}</span>
              <span><Badge tone={card.isActive ? 'success' : 'warning'}>{card.isActive ? 'مفعلة' : 'موقوفة'}</Badge></span>
              <span><Button variant={card.isActive ? 'danger' : 'ghost'} onClick={() => requestToggle(card)}>{card.isActive ? 'إيقاف البطاقة' : 'إعادة التفعيل'}</Button></span>
              <span>{formatDate(card.activatedAt)}</span>
            </div>
          ))}
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(pendingCard)}
        onClose={() => !status.actionLoading && setPendingCard(null)}
        onConfirm={handleToggle}
        title={pendingCard?.isActive ? 'تأكيد إيقاف البطاقة' : 'تأكيد إعادة تفعيل البطاقة'}
        description={pendingCard?.isActive
          ? 'عند إيقاف البطاقة سيتم إخفاء جميع بيانات الملف الشخصي والبطاقة من الصفحة العامة للزوار، وسيصل إشعار لصاحب البطاقة داخل النظام.'
          : 'سيتم إعادة تفعيل البطاقة وإتاحة الصفحة العامة مرة أخرى إذا كانت حالة الحساب تسمح بذلك.'}
        confirmText={pendingCard?.isActive ? 'تأكيد الإيقاف' : 'تأكيد التفعيل'}
        tone={pendingCard?.isActive ? 'danger' : 'primary'}
        loading={status.actionLoading}
      >
        {pendingCard ? (
          <div className="stack-sm">
            <div className="row-line"><strong>اسم المالك</strong><span>{pendingCard.userId?.fullName || '-'}</span></div>
            <div className="row-line"><strong>كود البطاقة</strong><span>{pendingCard.cardCode || '-'}</span></div>
            <div className="row-line"><strong>الحالة الحالية</strong><span>{pendingCard.isActive ? 'مفعلة' : 'موقوفة'}</span></div>
          </div>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
