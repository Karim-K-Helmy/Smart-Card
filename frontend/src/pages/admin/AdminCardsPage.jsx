import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { listCards, toggleCardStatus } from '../../services/api/admin';
import { extractApiError, formatDate } from '../../utils/api';

export default function AdminCardsPage() {
  const [cards, setCards] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '' });

  const load = async () => {
    try {
      const { data } = await listCards();
      setCards(data.data.data || []);
      setStatus({ loading: false, error: '' });
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error) });
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (card) => {
    try {
      await toggleCardStatus(card._id, { isActive: !card.isActive });
      await load();
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error) });
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader title="إدارة البطاقات" text="الحالة، الكود، الرابط المختصر، والتفعيل أو الإيقاف." />
      {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}
      <Card>
        <div className="table-like">
          <div className="table-row table-head"><span>المالك</span><span>الكود</span><span>الرابط</span><span>الحالة</span><span>التفعيل</span><span>تاريخ التفعيل</span></div>
          {cards.map((card) => (
            <div key={card._id} className="table-row">
              <span>{card.userId?.fullName}</span>
              <span>{card.cardCode}</span>
              <span>{card.shortLink}</span>
              <span><Badge tone={card.isActive ? 'success' : 'warning'}>{card.isActive ? 'active' : 'inactive'}</Badge></span>
              <span><Button variant="ghost" onClick={() => handleToggle(card)}>{card.isActive ? 'إيقاف' : 'تفعيل'}</Button></span>
              <span>{formatDate(card.activatedAt)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
