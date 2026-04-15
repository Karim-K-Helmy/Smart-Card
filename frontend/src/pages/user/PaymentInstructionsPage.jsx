import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { listPaymentMethods } from '../../services/api/payments';
import { getMyOrders } from '../../services/api/cards';
import { extractApiError, formatMoney } from '../../utils/api';

export default function PaymentInstructionsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [current, setCurrent] = useState({ plan: state?.plan || null, order: state?.order || null, methods: [] });
  const [status, setStatus] = useState({ loading: true, error: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const [methodsRes, ordersRes] = await Promise.all([listPaymentMethods(), getMyOrders()]);
        const methods = methodsRes.data.data || [];
        const latestOrder = state?.order || (ordersRes.data.data || []).find((item) => ['waiting_payment', 'pending', 'rejected'].includes(item.orderStatus));
        setCurrent({
          methods,
          order: latestOrder || null,
          plan: state?.plan || latestOrder?.cardPlanId || null,
        });
      } catch (error) {
        setStatus({ loading: false, error: extractApiError(error) });
        return;
      }
      setStatus({ loading: false, error: '' });
    };
    load();
  }, [state?.order, state?.plan]);

  const method = current.methods[0];
  const amount = current.order?.totalAmount || current.plan?.price || 0;
  const hasVisiblePrice = Number(amount) > 0;

  return (
    <div className="stack-lg">
      <PageHeader title="تعليمات الدفع" text="الدفع عبر الوسيلة المتاحة ثم رفع صورة الوصل للمراجعة." />
      <Card>
        {status.error ? <p className="error-text">{status.error}</p> : null}
        <div className="instruction-list">
          <p><strong>الخطة:</strong> {current.plan?.name || '-'}</p>
          <p><strong>رقم الطلب:</strong> {current.order?._id || '-'}</p>
          {hasVisiblePrice ? <p><strong>المبلغ المطلوب:</strong> {formatMoney(amount)}</p> : null}
          <p><strong>وسيلة الدفع:</strong> {method?.methodName || 'غير متاحة الآن'}</p>
          <p><strong>رقم التحويل:</strong> {method?.phoneNumber || '-'}</p>
          <p><strong>اسم المستلم:</strong> {method?.accountName || '-'}</p>
          <p><strong>التعليمات:</strong> {method?.instructions || 'بعد التحويل ارفع الوصل من الصفحة التالية.'}</p>
          <ol>
            {hasVisiblePrice ? <li>حوّل المبلغ المطلوب على الرقم الموضح.</li> : null}
            <li>التقط صورة واضحة للوصول أو شاشة التحويل.</li>
            <li>انتقل إلى صفحة رفع الوصل وأرسل التفاصيل كاملة.</li>
          </ol>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => navigate('/dashboard/request-card')}>رجوع</Button>
          <Button onClick={() => navigate('/dashboard/upload-receipt', { state: { order: current.order, plan: current.plan, method } })}>رفعت التحويل</Button>
        </div>
      </Card>
    </div>
  );
}
