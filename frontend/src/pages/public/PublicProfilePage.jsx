import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState';
import PublicUnavailableView from '../../components/common/PublicUnavailableView';
import { getPublicProfile } from '../../services/api/users';
import { extractApiError } from '../../utils/api';
const omarProfileIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='24' fill='%230a3d91'/%3E%3Ctext x='50%25' y='55%25' font-size='32' text-anchor='middle' fill='white' font-family='Arial'%3EOE%3C/text%3E%3C/svg%3E";

function formatPrice(value) {
  if (value === undefined || value === null || value === '') return 'السعر عند الطلب';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(numeric)} ج.م`;
}

function buildContactItems({ user }) {
  const items = [];
  if (user.phone) items.push({ key: 'phone', value: user.phone, href: `tel:${user.phone}`, icon: '📞', bg: '#4a90e2' });
  if (user.whatsappNumber) {
    const sanitized = String(user.whatsappNumber).replace(/\D/g, '');
    items.push({ key: 'whatsapp', value: user.whatsappNumber, href: `https://wa.me/${sanitized}`, iconClass: 'fa-brands fa-whatsapp', bg: '#25D366' });
  }
  if (user.email) items.push({ key: 'email', value: user.email, href: `mailto:${user.email}`, icon: '✉', bg: '#ea4335' });
  return items;
}

function getSocialIconAndColor(platformName = '') {
  const platform = platformName.toLowerCase();
  if (platform.includes('facebook') || platform.includes('فيس')) return { icon: 'f', bg: '#1877F2' };
  if (platform.includes('tiktok') || platform.includes('تيك')) return { icon: '♪', bg: '#000000' };
  if (platform.includes('instagram') || platform.includes('انست')) return { icon: '📸', bg: '#E1306C' };
  if (platform.includes('youtube') || platform.includes('يوتيوب')) return { icon: '▶', bg: '#FF0000' };
  if (platform.includes('snap') || platform.includes('سناب')) return { icon: '👻', bg: '#FFFC00', color: '#000' };
  if (platform.includes('x') || platform.includes('twitter')) return { icon: '𝕏', bg: '#000000' };
  return { icon: '🔗', bg: '#333333' };
}

function normalizeBusinessLocations(business = {}, user = {}) {
  if (Array.isArray(business.businessLocations) && business.businessLocations.length) {
    return business.businessLocations.map((item, index) => ({
      ...item,
      _id: item._id || `business-location-${index}`,
      name: item.name || item.businessName || user.fullName || `المكان ${index + 1}`,
      description: item.description || item.businessDescription || '',
      images: (item.images || []).map((image, imageIndex) => ({
        id: image.publicId || image.url || `image-${index}-${imageIndex}`,
        src: image.url || image,
      })).filter((image) => image.src),
    }));
  }

  const fallbackImages = business.logo ? [{ id: business.logoPublicId || business.logo, src: business.logo }] : [];
  const hasAnyBusinessData = business.businessName || business.businessDescription || business.address || business.googleMapsLink || business.phone || business.whatsappNumber || business.facebookLink || business.email || fallbackImages.length;
  if (!hasAnyBusinessData) return [];

  return [{
    _id: 'business-location-fallback',
    name: business.businessName || user.fullName || 'المكان التجاري',
    description: business.businessDescription || '',
    address: business.address || '',
    googleMapsLink: business.googleMapsLink || '',
    phone: business.phone || '',
    whatsappNumber: business.whatsappNumber || '',
    facebookLink: business.facebookLink || '',
    email: business.email || '',
    images: fallbackImages,
  }];
}

function buildLocationActions(location) {
  const actions = [];
  if (location.googleMapsLink) actions.push({ key: 'maps', label: 'خرائط جوجل', href: location.googleMapsLink });
  if (location.phone) actions.push({ key: 'phone', label: 'اتصال', href: `tel:${location.phone}` });
  if (location.whatsappNumber) actions.push({ key: 'whatsapp', label: 'واتساب', href: `https://wa.me/${String(location.whatsappNumber).replace(/\D/g, '')}` });
  if (location.facebookLink) actions.push({ key: 'facebook', label: 'فيسبوك', href: location.facebookLink });
  if (location.email) actions.push({ key: 'email', label: 'إرسال بريد', href: `mailto:${location.email}` });
  return actions;
}

export default function PublicProfilePage() {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unavailableState, setUnavailableState] = useState(null);
  const [expandedLocations, setExpandedLocations] = useState({});
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      setUnavailableState(null);
      try {
        const { data } = await getPublicProfile(slug);
        setProfile(data.data);
      } catch (apiError) {
        setProfile(null);
        const apiCode = apiError?.response?.data?.code;
        const apiDetails = apiError?.response?.data?.details || {};

        if (apiCode === 'ACCOUNT_SUSPENDED') {
          setUnavailableState({
            badge: apiDetails.subtitle || 'Profile Temporarily Unavailable',
            title: apiDetails.title || 'هذا الحساب غير متاح حالياً',
            message: 'تم إيقاف هذا الحساب أو إخفاؤه مؤقتاً، لذلك لا يمكن عرض أي بيانات خاصة بالملف الشخصي حالياً.',
            note: 'This account is currently unavailable for public viewing.',
            iconClass: 'fa-user-lock',
          });
        } else if (apiCode === 'CARD_SUSPENDED') {
          setUnavailableState({
            badge: apiDetails.subtitle || 'Card Temporarily Unavailable',
            title: apiDetails.title || 'تم إيقاف هذه البطاقة',
            message: 'تم تعليق هذه البطاقة من قِبل الإدارة، لذلك تم إخفاء جميع بيانات الملف الشخصي والبطاقة بالكامل.',
            note: 'This card has been suspended and is not available right now.',
            iconClass: 'fa-id-card',
          });
        } else {
          setError(extractApiError(apiError));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (!viewerOpen) return undefined;
    const handleKeydown = (event) => {
      if (event.key === 'Escape') setViewerOpen(false);
      if (event.key === 'ArrowRight') setCurrentViewIndex((prev) => (prev + 1) % viewerImages.length);
      if (event.key === 'ArrowLeft') setCurrentViewIndex((prev) => (prev - 1 + viewerImages.length) % viewerImages.length);
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [viewerOpen, viewerImages.length]);

  if (loading) {
    return <section style={{ background: '#1a1a1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><div>جارٍ تحميل البروفايل...</div></section>;
  }

  if (unavailableState) {
    return <PublicUnavailableView {...unavailableState} />;
  }

  if (error || !profile) {
    return <section style={{ background: '#1a1a1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><EmptyState title="البروفايل غير موجود" text={error || 'هذا الرابط غير متاح حالياً.'} /></section>;
  }

  const user = profile.user || {};
  const personal = profile.personalProfile || {};
  const business = profile.businessProfile || {};
  const socialLinks = profile.socialLinks || [];
  const products = (profile.products || []).filter((product) => product.isVisible !== false);
  const isPro = user.currentPlan === 'PRO';

  const personalName = user.fullName || 'اسم المستخدم';
  const personalHeadline = personal.jobTitle || '';
  const personalBio = personal.aboutText || user.bio || '';
  const personalAvatar = user.profileImage || '';
  const personalFirstLetter = personalName.charAt(0).toUpperCase();

  const contactItems = buildContactItems({ user });
  const businessLocations = normalizeBusinessLocations(business, user);

  const toggleLocation = (locationId) => {
    setExpandedLocations((prev) => ({ ...prev, [locationId]: !prev[locationId] }));
  };

  const openViewer = (images, index = 0) => {
    if (!images?.length) return;
    setViewerImages(images);
    setCurrentViewIndex(index);
    setViewerOpen(true);
  };

  const closeViewer = () => setViewerOpen(false);
  const showNext = (event) => {
    event.stopPropagation();
    setCurrentViewIndex((prev) => (prev + 1) % viewerImages.length);
  };
  const showPrev = (event) => {
    event.stopPropagation();
    setCurrentViewIndex((prev) => (prev - 1 + viewerImages.length) % viewerImages.length);
  };

  return (
    <div className="star-wrapper">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      <style>{`
        .star-wrapper { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1a1a1a; color: #fff; min-height: 100vh; display: flex; justify-content: center; padding: 30px 15px; direction: rtl; }
        .star-wrapper * { box-sizing: border-box; }
        .s-container { max-width: 600px; width: 100%; margin: 0 auto; }
        .s-header { text-align: center; margin-bottom: 30px; }
        .s-logo-circle { width: 160px; height: 160px; border-radius: 50%; border: 2px solid #cd7f32; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; background: #2a2a2a; position: relative; }
        .s-logo-inner { width: 148px; height: 148px; border-radius: 50%; background: linear-gradient(135deg, #8b3a3a 0%, #d4695f 100%); display: flex; align-items: center; justify-content: center; font-size: 64px; font-weight: bold; color: #fff; overflow: hidden; }
        .s-logo-inner img { width: 100%; height: 100%; object-fit: cover; }
        .s-verified-badge { position: absolute; bottom: 5px; right: 5px; width: 30px; height: 30px; background: #4a90e2; border-radius: 50%; border: 3px solid #1a1a1a; display: flex; align-items: center; justify-content: center; color: white; font-size: 15px; }
        .s-header h1 { font-size: 26px; margin-bottom: 6px; font-weight: 700; color: #fff; }
        .s-headline { font-size: 17px; font-weight: 600; color: #4a90e2; margin-bottom: 8px; }
        .s-bio { font-size: 15px; color: #b0b0b0; line-height: 1.6; padding: 0 10px; }
        .s-link-button { background: #fff; border-radius: 15px; padding: 16px 20px; margin-bottom: 12px; display: flex; align-items: center; text-decoration: none; color: #333; transition: all .3s ease; box-shadow: 0 4px 10px rgba(0,0,0,.15); }
        .s-link-button:hover { transform: translateY(-3px); box-shadow: 0 6px 15px rgba(0,0,0,.25); background: #000; color: #fff; }
        .s-link-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-left: 15px; font-size: 22px; }
        .s-link-text { flex: 1; text-align: center; font-size: 16px; font-weight: 600; }
        .s-link-action { width: 30px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #666; transition: all .3s ease; }
        .s-link-button:hover .s-link-action { color: #fff; }
        .s-heart { color: #ff4444; font-size: 20px; }
        .s-link-button:hover .s-heart { color: #ff4444; }
        .s-pro-section { margin: 35px 0; padding-top: 10px; border-top: 1px solid #333; }
        .s-pro-header { display: flex; align-items: center; margin-bottom: 18px; }
        .s-pro-header-line { width: 4px; height: 24px; background: linear-gradient(135deg, #8b3a3a, #d4695f); border-radius: 4px; margin-left: 10px; }
        .s-pro-header h2 { font-size: 20px; font-weight: 700; color: #fff; }
        .store-card-container { background: #fff; border: 3px solid #d4a574; border-radius: 30px; padding: 18px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,.3); margin: 22px 0; color: #333; }
        .store-card-main { background: #0d1829; border-radius: 22px; position: relative; overflow: hidden; width: 100%; aspect-ratio: 1 / 1; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,.2); transition: transform .3s ease, box-shadow .3s ease; }
        .store-card-main:hover { transform: translateY(-4px); box-shadow: 0 15px 35px rgba(0,0,0,.3); }
        .store-card-main img { width: 100%; height: 100%; object-fit: cover; }
        .bc-fallback-letter { color: #fff; font-size: 64px; font-weight: 800; }
        .bc-card-footer { padding: 16px 6px 6px; }
        .bc-store-name { font-size: 22px; font-weight: 800; margin-bottom: 10px; color: #1d2939; }
        .bc-store-subtitle { font-size: 14px; color: #475467; line-height: 1.7; margin-bottom: 16px; }
        .bc-card-actions { display: flex; align-items: center; gap: 12px; }
        .bc-contact-button { flex: 1; border: none; border-radius: 999px; padding: 13px 18px; background: linear-gradient(135deg, #111827, #1f2937); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; transition: transform .25s ease; }
        .bc-contact-button:hover { transform: translateY(-1px); }
        .bc-expand-arrow { width: 46px; height: 46px; border-radius: 50%; background: #f2f4f7; color: #1d2939; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: transform .3s ease; }
        .bc-expand-arrow.open { transform: rotate(180deg); }
        .bc-accordion { max-height: 0; overflow: hidden; transition: max-height .45s ease, padding-top .45s ease; }
        .bc-accordion.open { max-height: 2000px; overflow: visible; padding-top: 18px; }
        .bc-details-grid { display: grid; gap: 12px; }
        .bc-detail-item { background: #f8fafc; border: 1px solid #e4e7ec; border-radius: 18px; padding: 14px 16px; }
        .bc-detail-label { font-size: 13px; color: #667085; margin-bottom: 6px; font-weight: 700; }
        .bc-detail-value { font-size: 15px; color: #101828; line-height: 1.7; word-break: break-word; }
        .bc-link-pills { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
        .bc-link-pill { text-decoration: none; background: #111827; color: #fff; padding: 10px 14px; border-radius: 999px; font-size: 14px; font-weight: 700; }
        .s-products-grid { display: grid; gap: 18px; }
        .product-desc-box { background: #f8fafc; border-radius: 16px; padding: 12px 14px; color: #475467; line-height: 1.7; margin-bottom: 12px; min-height: 78px; }
        .product-price-box { background: linear-gradient(135deg, #8b3a3a, #d4695f); color: #fff; text-align: center; border-radius: 16px; padding: 12px 14px; font-size: 16px; font-weight: 800; }
        .product-name-label { font-size: 12px; color: #667085; margin-bottom: 6px; font-weight: 800; }
        .product-card-main { background: linear-gradient(180deg, #f8fafc 0%, #eef2f6 100%); }
        .product-card-main img { width: 100%; height: 100%; object-fit: contain; padding: 16px; background: transparent; }
        .s-divider { width: 100%; height: 1px; background: #333; margin: 35px 0 20px; }
        .s-made-by { text-align: center; color: #9ca3af; margin-bottom: 14px; }
        .s-omar-card { background: linear-gradient(135deg, #ff6b9d 0%, #8b5cf6 50%, #06b6d4 100%); border-radius: 16px; padding: 30px; text-align: center; position: relative; overflow: hidden; box-shadow: 0 10px 20px rgba(0,0,0,.4); }
        .s-omar-logo { width: 96px; height: 96px; border-radius: 50%; border: 4px solid rgba(255,255,255,.95); background: rgba(255,255,255,.12); margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,.22); }
        .s-omar-logo img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .s-omar-title { font-size: 26px; font-weight: bold; color: #fff; margin-bottom: 8px; position: relative; z-index: 1; }
        .s-omar-subtitle { font-size: 14px; color: #fff; position: relative; z-index: 1; opacity: .9; }
        .s-footer-card { background: rgba(255,255,255,.95); border-radius: 12px; padding: 15px; text-align: center; color: #374151; font-size: 13px; line-height: 1.8; margin-top: 20px; font-weight: 700; box-shadow: 0 10px 24px rgba(0,0,0,.12); }
        .bc-viewer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.92); display: flex; align-items: center; justify-content: center; z-index: 9999; opacity: 0; visibility: hidden; transition: .3s ease; direction: ltr; }
        .bc-viewer-overlay.open { opacity: 1; visibility: visible; }
        .bc-viewer-content { position: relative; max-width: 90%; max-height: 86%; display: flex; flex-direction: column; align-items: center; }
        .bc-viewer-img { max-width: 100%; max-height: 78vh; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.5); object-fit: contain; }
        .bc-viewer-close { position: absolute; top: -46px; right: 0; background: none; border: none; color: #fff; font-size: 32px; cursor: pointer; }
        .bc-viewer-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(212,165,116,.2); color: #d4a574; border: 2px solid #d4a574; width: 50px; height: 50px; border-radius: 50%; font-size: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; }
        .bc-viewer-nav.prev { left: -70px; } .bc-viewer-nav.next { right: -70px; }
        .bc-viewer-title { color: #fff; text-align: center; font-size: 18px; font-weight: 600; margin-top: 15px; width: 100%; }
        @media (max-width: 600px) {
          .bc-viewer-nav.prev { left: 10px; background: rgba(0,0,0,.6); border: none; }
          .bc-viewer-nav.next { right: 10px; background: rgba(0,0,0,.6); border: none; }
          .bc-viewer-img { max-height: 65vh; }
        }
      `}</style>

      <div className="s-container">
        <div className="s-header">
          <div className="s-logo-circle">
            <div className="s-logo-inner">{personalAvatar ? <img src={personalAvatar} alt={personalName} /> : personalFirstLetter}</div>
            <div className="s-verified-badge"><i className="fa-solid fa-check"></i></div>
          </div>
          <h1>{personalName}</h1>
          {personalHeadline ? <div className="s-headline">{personalHeadline}</div> : null}
          {personalBio ? <div className="s-bio">{personalBio}</div> : null}
        </div>

        {contactItems.map((item) => (
          <a href={item.href} target="_blank" rel="noreferrer" className="s-link-button" key={item.key}>
            <div className="s-link-icon" style={{ background: item.bg, color: item.color || '#fff' }}>
              {item.iconClass ? <i className={item.iconClass}></i> : item.icon}
            </div>
            <div className="s-link-text">{item.value}</div>
            <div className="s-link-action">{item.iconClass ? <i className={item.iconClass}></i> : item.icon}</div>
          </a>
        ))}

        {socialLinks.map((link) => {
          const { icon, bg, color } = getSocialIconAndColor(link.platformName);
          return (
            <a href={link.url} target="_blank" rel="noreferrer" className="s-link-button" key={link._id || link.platformName}>
              <div className="s-link-icon" style={{ background: bg, color: color || '#fff' }}>{icon}</div>
              <div className="s-link-text">{link.platformName}</div>
              <div className="s-link-action s-heart">❤️</div>
            </a>
          );
        })}

        {isPro && businessLocations.length > 0 ? (
          <div className="s-pro-section">
            <div className="s-pro-header"><div className="s-pro-header-line"></div><h2>الأماكن التجارية</h2></div>
            {businessLocations.map((location) => {
              const imageList = location.images || [];
              const primaryImage = imageList[0]?.src || '';
              const actions = buildLocationActions(location);
              const locationLetter = (location.name || 'م').charAt(0).toUpperCase();
              const isExpanded = !!expandedLocations[location._id];
              return (
                <div key={location._id} className="store-card-container">
                  <div className="store-card-main" onClick={() => openViewer(imageList, 0)} title="عرض صور المكان">
                    {primaryImage ? <img src={primaryImage} alt={location.name} /> : <div className="bc-fallback-letter">{locationLetter}</div>}
                  </div>
                  <div className="bc-card-footer">
                    <div className="bc-store-name">{location.name}</div>
                    {location.description ? <div className="bc-store-subtitle">{location.description}</div> : null}
                    <div className="bc-card-actions">
                      <button type="button" className="bc-contact-button" onClick={() => toggleLocation(location._id)}>مزيد</button>
                      <div className={`bc-expand-arrow ${isExpanded ? 'open' : ''}`}><i className="fa-solid fa-angle-down"></i></div>
                    </div>
                    <div className={`bc-accordion ${isExpanded ? 'open' : ''}`}>
                      <div className="bc-details-grid">
                        {location.description ? <div className="bc-detail-item"><div className="bc-detail-label">وصف المكان التجاري</div><div className="bc-detail-value">{location.description}</div></div> : null}
                        {location.address ? <div className="bc-detail-item"><div className="bc-detail-label">العنوان النصي</div><div className="bc-detail-value">{location.address}</div></div> : null}
                        {actions.length ? <div className="bc-detail-item"><div className="bc-detail-label">روابط</div><div className="bc-link-pills">{actions.map((action) => <a key={action.key} href={action.href} target="_blank" rel="noreferrer" className="bc-link-pill">{action.label}</a>)}</div></div> : null}
                        {location.phone ? <div className="bc-detail-item"><div className="bc-detail-label">رقم الهاتف</div><div className="bc-detail-value">{location.phone}</div></div> : null}
                        {location.whatsappNumber ? <div className="bc-detail-item"><div className="bc-detail-label">رقم واتساب</div><div className="bc-detail-value">{location.whatsappNumber}</div></div> : null}
                        {location.facebookLink ? <div className="bc-detail-item"><div className="bc-detail-label">رابط فيسبوك</div><div className="bc-detail-value">{location.facebookLink}</div></div> : null}
                        {location.email ? <div className="bc-detail-item"><div className="bc-detail-label">البريد الإلكتروني</div><div className="bc-detail-value">{location.email}</div></div> : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {isPro && products.length > 0 ? (
          <div className="s-pro-section">
            <div className="s-pro-header"><div className="s-pro-header-line"></div><h2>معرض الاعمال</h2></div>
            <div className="s-products-grid">
              {products
                .filter((product) => {
                  const hasImage = !!(product?.image && String(product.image).trim());
                  const hasName = !!(product?.name && String(product.name).trim());
                  const hasDescription = !!(product?.description && String(product.description).trim());
                  const hasPrice = product?.price !== undefined && product?.price !== null && String(product.price).trim() !== '' && Number(product.price) > 0;
                  return hasImage || hasName || hasDescription || hasPrice;
                })
                .map((product) => {
                  const hasImage = !!(product?.image && String(product.image).trim());
                  const hasName = !!(product?.name && String(product.name).trim());
                  const hasDescription = !!(product?.description && String(product.description).trim());
                  const hasPrice = product?.price !== undefined && product?.price !== null && String(product.price).trim() !== '' && Number(product.price) > 0;

                  return (
                    <div key={product._id} className="store-card-container">
                      <div className="store-card-main product-card-main" onClick={() => hasImage ? openViewer([{ id: product.imagePublicId || product.image, src: product.image }], 0) : null} title="عرض صورة المنتج">
                        {hasImage ? <img src={product.image} alt={product.name || 'product'} /> : <div className="bc-fallback-letter" style={{ fontSize: 60 }}>📦</div>}
                      </div>
                      <div className="bc-card-footer">
                        {hasName ? <div className="bc-store-name">{product.name}</div> : null}
                        {hasDescription ? <div className="product-desc-box">{product.description}</div> : null}
                        {hasPrice ? <div className="product-price-box">{formatPrice(product.price)}</div> : null}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : null}

        <div className="s-divider"></div>
        <div className="s-made-by">Made by:</div>
        <div className="s-omar-card">
          <div className="s-omar-logo"><img src={omarProfileIcon} alt="Omar profile" /></div>
          <div className="s-omar-title">صنع بواسطة line start.pro لاين ستارت</div>
        </div>
        <div className="s-footer-card">بريس للخدمات الإعلامية والإعلانية و التدريب عليها</div>
      </div>

      {viewerImages.length > 0 ? (
        <div className={`bc-viewer-overlay ${viewerOpen ? 'open' : ''}`} onClick={closeViewer}>
          <div className="bc-viewer-content" onClick={(event) => event.stopPropagation()}>
            <button className="bc-viewer-close" onClick={closeViewer}><i className="fa-solid fa-xmark"></i></button>
            {viewerImages.length > 1 ? <button className="bc-viewer-nav prev" onClick={showPrev}><i className="fa-solid fa-angle-left"></i></button> : null}
            <img src={viewerImages[currentViewIndex].src} alt="preview" className="bc-viewer-img" />
            <div className="bc-viewer-title">{viewerImages[currentViewIndex]?.src ? `صورة ${currentViewIndex + 1} من ${viewerImages.length}` : ''}</div>
            {viewerImages.length > 1 ? <button className="bc-viewer-nav next" onClick={showNext}><i className="fa-solid fa-angle-right"></i></button> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}