import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getMyCard } from '../../services/api/cards';
import { extractApiError, formatDate } from '../../utils/api';

export default function MyCardPage() {
  const [card, setCard] = useState(null);
  const [status, setStatus] = useState({ loading: true, error: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getMyCard();
        setCard(data.data);
      } catch (error) {
        setStatus({ loading: false, error: extractApiError(error) });
        return;
      }
      setStatus({ loading: false, error: '' });
    };
    load();
  }, []);

  return (
    <div className="stack-lg">
      <PageHeader title="بطاقتي" text="شكل البطاقة النهائية والرابط والـ QR بعد التفعيل." />
      {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}
      <div className="grid grid-2">
        <Card title="البطاقة الذكية">
          <div className="smart-card-preview">
            <div>
              <small>LineStart Smart Card</small>
              <h3>{card?.cardOrderId?.cardPlanId?.name || 'بطاقة غير متاحة'}</h3>
              <p>{card?.cardCode || '-'}</p>
            </div>
            <div className="qr-box big">{card?.qrCodeImage ? <img src={card.qrCodeImage} alt="QR" /> : 'QR'}</div>
          </div>
        </Card>
        <Card title="تفاصيل البطاقة">
          <div className="stack-md">
            <div className="row-line"><strong>الرابط</strong><span>{card?.shortLink || '-'}</span></div>
            <div className="row-line"><strong>الحالة</strong><span>{card?.isActive ? 'مفعلة' : 'غير مفعلة'}</span></div>
            <div className="row-line"><strong>تاريخ التفعيل</strong><span>{formatDate(card?.activatedAt)}</span></div>
            <div className="row-line"><strong>تاريخ الانتهاء</strong><span>{formatDate(card?.expiresAt)}</span></div>
            <div className="header-actions">
              <Button onClick={() => card?.shortLink && navigator.clipboard.writeText(card.shortLink)}>نسخ الرابط</Button>
              <Button variant="secondary" onClick={() => card?.shortLink && window.open(card.shortLink, '_blank')}>فتح الرابط</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
