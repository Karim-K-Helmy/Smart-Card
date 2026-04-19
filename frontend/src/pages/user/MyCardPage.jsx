import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { downloadMyCardPdf, getMyCard, getMyCardPreview } from '../../services/api/cards';
import { extractApiError, formatDate } from '../../utils/api';

export default function MyCardPage() {
  const [card, setCard] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState({ loading: true, error: '' });

  useEffect(() => {
    let objectUrl = '';

    const load = async () => {
      try {
        const { data: cardResponse } = await getMyCard();
        const loadedCard = cardResponse.data;
        setCard(loadedCard);

        if (loadedCard?.isActive) {
          const previewResponse = await getMyCardPreview();
          objectUrl = URL.createObjectURL(previewResponse.data);
          setPreviewUrl(objectUrl);
        } else {
          setPreviewUrl('');
        }

        setStatus({ loading: false, error: '' });
      } catch (error) {
        setStatus({ loading: false, error: extractApiError(error) });
      }
    };

    load();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, []);

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      const response = await downloadMyCardPdf();
      const pdfUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'my-card.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(pdfUrl);
    } catch (error) {
      setStatus((current) => ({ ...current, error: extractApiError(error) }));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader title="بطاقتي" text="معاينة البطاقة النهائية وتحميلها كملف PDF من صفحتين. وعند مسح الـ QR يتم فتح الصفحة العامة/معرض الأعمال مباشرة." />
      {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}
      {card && card.isActive === false ? (
        <Card>
          <div className="notice-card notice-danger">
            <strong>تم إيقاف البطاقة</strong>
            <p>هذه البطاقة موقوفة حالياً، لذلك تم تعطيل صفحتها العامة مؤقتًا. يُرجى الرجوع إلى الإدارة.</p>
            <small>{formatDate(card?.suspendedAt || card?.lastStatusChangedAt)}</small>
          </div>
        </Card>
      ) : null}
      <div className="grid grid-2">
        <Card title="معاينة البطاقة الخلفية">
          <div className="stack-md">
            <div className="smart-card-preview" style={{ minHeight: 420, justifyContent: 'center' }}>
              {card?.isActive && previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Card Preview"
                  style={{ width: '100%', maxWidth: 320, borderRadius: 16, display: 'block', margin: '0 auto' }}
                />
              ) : (
                <p>{status.loading ? 'جاري تحميل المعاينة...' : card?.isActive ? 'لا توجد معاينة متاحة' : 'المعاينة غير متاحة لأن البطاقة موقوفة حالياً'}</p>
              )}
            </div>
            <Button onClick={handleDownloadPdf} disabled={isDownloading || status.loading || !card || !card?.isActive}>
              {isDownloading ? 'جاري تجهيز PDF...' : 'حفظ كـ PDF'}
            </Button>
          </div>
        </Card>
        <Card title="تفاصيل البطاقة">
          <div className="stack-md">
            <div className="row-line"><strong>نوع الباقة</strong><span>{card?.cardOrderId?.cardPlanId?.name || '-'}</span></div>
            <div className="row-line"><strong>رابط الصفحة العامة</strong><span>{card?.shortLink || '-'}</span></div>
            <div className="row-line"><strong>الحالة</strong><span>{card?.isActive ? 'مفعلة' : 'موقوفة'}</span></div>
            <div className="row-line"><strong>تاريخ آخر تغيير</strong><span>{formatDate(card?.lastStatusChangedAt || card?.activatedAt)}</span></div>
            <div className="row-line"><strong>تاريخ التفعيل</strong><span>{formatDate(card?.activatedAt)}</span></div>
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
