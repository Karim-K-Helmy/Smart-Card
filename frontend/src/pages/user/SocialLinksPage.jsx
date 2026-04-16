import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getMyProfile, updateProfile } from '../../services/api/users';
import { extractApiError, toFormData } from '../../utils/api';

const emptyLink = { platformName: '', url: '' };

export default function SocialLinksPage({ embedded = false }) {
  const [links, setLinks] = useState([emptyLink]);
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', success: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getMyProfile();
        const socialLinks = data.data.socialLinks || [];
        setLinks(socialLinks.length ? socialLinks.map((item) => ({ platformName: item.platformName, url: item.url })) : [emptyLink]);
      } catch (error) {
        setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
      } finally {
        setStatus((prev) => ({ ...prev, loading: false }));
      }
    };
    load();
  }, []);

  const handleChange = (index, key, value) => {
    setLinks((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus((prev) => ({ ...prev, saving: true, error: '', success: '' }));
    try {
      const cleaned = links.filter((item) => item.platformName && item.url).map((item, index) => ({ ...item, sortOrder: index }));
      await updateProfile(toFormData({ socialLinks: cleaned }));
      setStatus((prev) => ({ ...prev, success: 'تم حفظ روابط السوشيال.' }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  return (
    <div className={embedded ? 'stack-md profile-section-embedded' : 'stack-lg'}>
      {!embedded ? <PageHeader title="روابط السوشيال" text="أضف الروابط التي ستظهر في البروفايل العام." actions={<Button variant="secondary" onClick={() => setLinks((prev) => [...prev, emptyLink])}>إضافة رابط</Button>} /> : null}
      <Card>
        {embedded ? <div className="embedded-section-action"><Button variant="secondary" onClick={() => setLinks((prev) => [...prev, emptyLink])}>إضافة رابط</Button></div> : null}
        <form className="form-card" onSubmit={handleSubmit}>
          {links.map((link, index) => (
            <div key={index} className="form-grid">
              <label><span>المنصة</span><input value={link.platformName} onChange={(e) => handleChange(index, 'platformName', e.target.value)} placeholder="Facebook / Instagram / WhatsApp" /></label>
              <label><span>الرابط</span><input value={link.url} onChange={(e) => handleChange(index, 'url', e.target.value)} placeholder="https://..." /></label>
            </div>
          ))}
          {status.error ? <p className="error-text">{status.error}</p> : null}
          {status.success ? <p className="success-text">{status.success}</p> : null}
          <Button type="submit" disabled={status.saving}>{status.saving ? 'جارٍ الحفظ...' : 'حفظ الروابط'}</Button>
        </form>
      </Card>
    </div>
  );
}
