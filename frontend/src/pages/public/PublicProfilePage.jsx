import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/common/EmptyState';
import { getPublicProfile } from '../../services/api/users';
import { extractApiError } from '../../utils/api';

export default function PublicProfilePage() {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getPublicProfile(slug);
        setProfile(data.data);
      } catch (apiError) {
        setError(extractApiError(apiError));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) {
    return <section className="section"><div className="container"><Card>جارٍ تحميل البروفايل...</Card></div></section>;
  }

  if (error || !profile) {
    return (
      <section className="section">
        <div className="container">
          <EmptyState title="البروفايل غير موجود" text={error || 'هذا الرابط غير متاح حاليًا أو لم يتم تفعيله بعد.'} />
        </div>
      </section>
    );
  }

  const user = profile.user || {};
  const personal = profile.personalProfile || {};
  const business = profile.businessProfile || {};
  const isPro = user.currentPlan === 'PRO';
  const contactName = isPro ? (business.businessName || user.fullName) : user.fullName;
  const subtitle = isPro ? (business.businessDescription || personal.jobTitle) : personal.jobTitle;

  return (
    <section className="profile-public-wrap">
      <div className="container profile-public-grid">
        <Card className="profile-side-card">
          <div className="profile-avatar large">{contactName?.charAt(0)}</div>
          <Badge tone={isPro ? 'info' : 'success'}>{user.currentPlan || 'NONE'}</Badge>
          <h1>{contactName}</h1>
          <p className="muted">{subtitle || 'بطاقة تعريفية رقمية'}</p>
          <p>{user.bio || personal.aboutText || business.promoBoxText || 'لا توجد نبذة متاحة.'}</p>
          <div className="contact-stack compact">
            <span>{user.phone || '-'}</span>
            <span>{user.whatsappNumber || '-'}</span>
            {isPro ? <span>{user.email || '-'}</span> : null}
            {isPro && business.address ? <span>{business.address}</span> : null}
          </div>
        </Card>

        <div className="stack-lg">
          <Card title="نبذة عامة">
            <p>{personal.aboutText || business.businessDescription || user.bio || 'لا توجد تفاصيل إضافية.'}</p>
          </Card>

          {isPro ? (
            <>
              <Card title="روابط التواصل">
                <div className="link-grid">
                  {profile.socialLinks?.length ? profile.socialLinks.map((link) => (
                    <a key={link._id} className="link-chip" href={link.url} target="_blank" rel="noreferrer">
                      {link.platformName}
                    </a>
                  )) : <p>لا توجد روابط متاحة.</p>}
                </div>
              </Card>

              <Card title="البيانات التجارية">
                <div className="stack-md">
                  <p><strong>اسم النشاط:</strong> {business.businessName || '-'}</p>
                  <p><strong>الوصف:</strong> {business.businessDescription || '-'}</p>
                  <p><strong>العنوان:</strong> {business.address || '-'}</p>
                  <p><strong>العرض الترويجي:</strong> {business.promoBoxText || 'لا يوجد عرض ترويجي حاليًا.'}</p>
                </div>
              </Card>

              <Card title="الأعمال">
                <div className="stack-md">
                  {profile.products?.length ? profile.products.map((product) => (
                    <div key={product._id} className="product-row">
                      <div>
                        <strong>{product.name}</strong>
                        <p>{product.description || 'بدون وصف.'}</p>
                      </div>
                    </div>
                  )) : <p>لا توجد أعمال حتى الآن.</p>}
                </div>
              </Card>
            </>
          ) : (
            <Card title="معلومات أساسية">
              <p>هذه بطاقة Star، لذلك يتم عرض البيانات الأساسية فقط بشكل مبسط.</p>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}