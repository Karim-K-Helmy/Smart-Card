import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getMyProfile, updateProfile } from '../../services/api/users';
import { extractApiError, toFormData } from '../../utils/api';

const SOCIAL_PLATFORM_OPTIONS = [
  'Facebook',
  'Instagram',
  'WhatsApp',
  'X',
  'TikTok',
  'Snapchat',
  'LinkedIn',
  'YouTube',
  'Telegram',
  'Website',
  'Other',
];

const createEmptyLink = () => ({ id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, platformName: 'Facebook', customPlatformName: '', url: '' });

const normalizeLink = (item = {}) => {
  const matched = SOCIAL_PLATFORM_OPTIONS.find((option) => option !== 'Other' && option.toLowerCase() === String(item.platformName || '').toLowerCase());
  return {
    id: item._id || item.id || `link-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    platformName: matched || 'Other',
    customPlatformName: matched ? '' : (item.platformName || ''),
    url: item.url || '',
  };
};

export default function SocialLinksPage({ embedded = false }) {
  const [links, setLinks] = useState([createEmptyLink()]);
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', success: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getMyProfile();
        const socialLinks = data.data.socialLinks || [];
        setLinks(socialLinks.length ? socialLinks.map(normalizeLink) : [createEmptyLink()]);
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

  const addLink = () => setLinks((prev) => [...prev, createEmptyLink()]);

  const removeLink = (id) => {
    setLinks((prev) => {
      const next = prev.filter((item) => item.id !== id);
      return next.length ? next : [createEmptyLink()];
    });
    setStatus((prev) => ({ ...prev, error: '', success: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus((prev) => ({ ...prev, saving: true, error: '', success: '' }));
    try {
      const cleaned = links
        .map((item, index) => ({
          platformName: item.platformName === 'Other' ? String(item.customPlatformName || '').trim() : item.platformName,
          url: String(item.url || '').trim(),
          sortOrder: index,
        }))
        .filter((item) => item.platformName && item.url);

      await updateProfile(toFormData({ socialLinks: cleaned }));
      setLinks(cleaned.length ? cleaned.map(normalizeLink) : [createEmptyLink()]);
      setStatus((prev) => ({ ...prev, success: 'تم حفظ روابط السوشيال.' }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  const canAddMore = useMemo(() => links.every((item) => String(item.url || '').trim()), [links]);

  return (
    <div className={embedded ? 'stack-md profile-section-embedded' : 'stack-lg'}>
      {!embedded ? <PageHeader title="روابط السوشيال" text="أضف الروابط التي ستظهر في البروفايل العام مع إمكانية التعديل والحذف." actions={<Button variant="secondary" onClick={addLink} disabled={!canAddMore}>إضافة رابط</Button>} /> : null}
      <Card>
        {embedded ? <div className="embedded-section-action"><Button variant="secondary" onClick={addLink} disabled={!canAddMore}>إضافة رابط</Button></div> : null}
        <form className="form-card" onSubmit={handleSubmit}>
          {links.map((link, index) => (
            <div key={link.id || index} className="stack-sm" style={{ marginBottom: 12, padding: 12, border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <strong>رابط #{index + 1}</strong>
                <Button type="button" variant="ghost" onClick={() => removeLink(link.id)}>حذف</Button>
              </div>
              <div className="form-grid">
                <label>
                  <span>المنصة</span>
                  <select value={link.platformName} onChange={(e) => handleChange(index, 'platformName', e.target.value)}>
                    {SOCIAL_PLATFORM_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label><span>الرابط</span><input value={link.url} onChange={(e) => handleChange(index, 'url', e.target.value)} placeholder="https://..." /></label>
              </div>
              {link.platformName === 'Other' ? (
                <label>
                  <span>اسم المنصة</span>
                  <input value={link.customPlatformName} onChange={(e) => handleChange(index, 'customPlatformName', e.target.value)} placeholder="اكتب اسم المنصة" />
                </label>
              ) : null}
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
