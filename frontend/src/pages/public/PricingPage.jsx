import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import SectionTitle from '../../components/ui/SectionTitle';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { getCardPlans } from '../../services/api/cards';
import { extractApiError, formatMoney } from '../../utils/api';

export default function PricingPage() {
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

  return (
    <section className="section">
      <div className="container">
        <SectionTitle
          eyebrow="الباقات"
          title="باقات البطاقات الذكية"
          text="يتم جلب الباقات مباشرة من الخادم لعرض السعر والمزايا الأحدث بشكل دقيق وواضح."
        />

        {error ? <p className="error-text">{error}</p> : null}
        {loading ? <p>جارٍ تحميل الباقات...</p> : null}

        {!loading && !plans.length ? (
          <Card icon="fa-layer-group">
            <p>لا توجد باقات متاحة حاليًا. تأكد من تشغيل الخادم وقاعدة البيانات.</p>
          </Card>
        ) : null}

        <div className="pricing-grid pricing-grid-two">
          {plans.map((plan, index) => (
            <Card key={plan._id} className={index === 1 ? 'featured-panel pricing-card-pro' : 'pricing-card-pro'} icon={plan.planCode === 'PRO' ? 'fa-briefcase' : 'fa-id-card'}>
              <div className="plan-top">
                <h3>{plan.name}</h3>
                <Badge tone={plan.planCode === 'PRO' ? 'info' : 'success'}>{plan.planCode}</Badge>
              </div>

              <p>{plan.description}</p>
              <strong className="muted">{formatMoney(plan.price)}</strong>

              <ul className="feature-list">
                {(plan.features || []).map((feature) => (
                  <li key={feature}>
                    <i className="fa-solid fa-check"></i>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/auth/register">
                <Button fullWidth variant={plan.planCode === 'PRO' ? 'primary' : 'secondary'}>
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
