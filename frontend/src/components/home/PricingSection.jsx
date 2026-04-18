import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { getCardPlans } from '../../services/api/cards';
import { extractApiError, formatMoney } from '../../utils/api';

const hasVisiblePrice = (price) => Number(price) > 0;
const hasVisibleDuration = (durationDays) => Number(durationDays) > 0;

const fallbackCards = [
  {
    key: 'PRO',
    name: 'بطاقة Line Pro',
    description: 'صفحة رقمية متكاملة لعرض خدماتك ومنتجاتك بصورة احترافية.',
    features: [
      'صفحة احترافية لعرض الأعمال والخدمات.',
      'روابط التواصل وبيانات النشاط في مكان واحد.',
      'مناسبة للشركات والعلامات التجارية وصناع الخدمات.',
    ],
    badgeTone: 'info',
    icon: 'fa-briefcase',
  },
  {
    key: 'STAR',
    name: 'بطاقة Line Start',
    description: 'بطاقة تعريف رقمية بديلة للكروت التقليدية وسهلة المشاركة.',
    features: [
      'عرض بياناتك الأساسية وروابطك بسرعة.',
      'مشاركة فورية عبر QR أو الرابط المباشر.',
      'مثالية للأفراد ورواد الأعمال وبدايات المشاريع.',
    ],
    badgeTone: 'success',
    icon: 'fa-id-card',
  },
];

export default function PricingSection() {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getCardPlans();
        setPlans((data.data || []).filter((plan) => ['STAR', 'PRO'].includes(plan.planCode)));
      } catch (apiError) {
        setError(extractApiError(apiError));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const renderedPlans = plans.length
    ? plans.map((plan) => ({
        key: plan.planCode,
        name: plan.name,
        description: plan.description,
        features: plan.features || [],
        price: plan.price,
        durationDays: plan.durationDays,
        badgeTone: plan.planCode === 'PRO' ? 'info' : 'success',
        icon: plan.planCode === 'PRO' ? 'fa-briefcase' : 'fa-id-card',
      }))
    : fallbackCards;

  return (
    <section id="pricing" className="section smart-cards-showcase">
      <div className="container">
        <SectionTitle
          eyebrow="الباقات"
          title="اختر البطاقة الأنسب لهويتك الرقمية"
          text="باقات واضحة تمنحك حضورًا رقميًا أنيقًا وتجربة استخدام سهلة، مع إمكانية جلب أحدث الأسعار من الخادم."
        />

        {error ? <p className="error-text">{error}</p> : null}
        {loading ? <p>جارٍ تحميل الباقات...</p> : null}

        <div className="pricing-grid pricing-grid-two">
          {renderedPlans.map((plan, index) => (
            <Card
              key={plan.key}
              className={index === 0 ? 'featured-panel pricing-card-pro' : 'pricing-card-pro'}
              icon={plan.icon}
            >
              <div className="plan-top">
                <h3>{plan.name}</h3>
                <Badge tone={plan.badgeTone}>{plan.key}</Badge>
              </div>

              <p>{plan.description}</p>

              {hasVisiblePrice(plan.price) ? <strong className="muted">{formatMoney(plan.price)}</strong> : null}
              {hasVisibleDuration(plan.durationDays) ? <small className="muted">{plan.durationDays} يوم</small> : null}

              <ul className="feature-list">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <i className="fa-solid fa-check"></i>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/auth/register">
                <Button fullWidth variant={plan.key === 'PRO' ? 'primary' : 'secondary'}>
                  <i className="fa-solid fa-id-card"></i>
                  اطلب الآن
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
