import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getMyProfile, updateProfile } from '../../services/api/users';
import { extractApiError, toFormData } from '../../utils/api';

const MAX_IMAGES_PER_LOCATION = 5;
const emptyLocation = {
  name: '',
  description: '',
  address: '',
  googleMapsLink: '',
  phone: '',
  whatsappNumber: '',
  facebookLink: '',
  email: '',
  existingImages: [],
  newImages: [],
};

function normalizeLocation(location = {}) {
  return {
    ...emptyLocation,
    name: location.name || location.businessName || '',
    description: location.description || location.businessDescription || '',
    address: location.address || '',
    googleMapsLink: location.googleMapsLink || '',
    phone: location.phone || '',
    whatsappNumber: location.whatsappNumber || '',
    facebookLink: location.facebookLink || '',
    email: location.email || '',
    existingImages: (location.images || []).map((item) => item.url || item).filter(Boolean),
    newImages: [],
  };
}

function createLocationPreview(location) {
  const existingCount = location.existingImages?.length || 0;
  const newCount = location.newImages?.length || 0;
  return existingCount + newCount;
}

export default function BusinessProfilePage({ embedded = false }) {
  const [locations, setLocations] = useState([normalizeLocation()]);
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', success: '', currentPlan: 'NONE' });

  useEffect(() => {
    const load = async () => {
      try {
        const profileRes = await getMyProfile();
        const business = profileRes.data.data.businessProfile || {};
        const preparedLocations = Array.isArray(business.businessLocations) && business.businessLocations.length
          ? business.businessLocations.map(normalizeLocation)
          : [normalizeLocation({
              name: business.businessName,
              description: business.businessDescription,
              address: business.address,
              googleMapsLink: business.googleMapsLink,
              phone: business.phone,
              whatsappNumber: business.whatsappNumber,
              facebookLink: business.facebookLink,
              email: business.email,
              images: business.logo ? [business.logo] : [],
            })];

        setLocations(preparedLocations);
        setStatus((prev) => ({ ...prev, currentPlan: profileRes.data.data.user?.currentPlan || 'NONE' }));
      } catch (error) {
        setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
      } finally {
        setStatus((prev) => ({ ...prev, loading: false }));
      }
    };
    load();
  }, []);

  const filledLocationsCount = useMemo(() => locations.filter((item) => item.name || item.description || item.address).length, [locations]);

  const updateLocation = (index, key, value) => {
    setLocations((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  };

  const addLocation = () => {
    setLocations((prev) => [...prev, normalizeLocation()]);
  };

  const removeLocation = (index) => {
    setLocations((prev) => prev.length === 1 ? prev.map(() => normalizeLocation()) : prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleImageChange = (index, filesList) => {
    const files = Array.from(filesList || []);
    setLocations((prev) => prev.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const availableSlots = MAX_IMAGES_PER_LOCATION - (item.existingImages?.length || 0);
      return { ...item, newImages: files.slice(0, Math.max(availableSlots, 0)) };
    }));
  };

  const removeExistingImage = (locationIndex, imageIndex) => {
    setLocations((prev) => prev.map((item, itemIndex) => {
      if (itemIndex !== locationIndex) return item;
      return { ...item, existingImages: item.existingImages.filter((_, idx) => idx !== imageIndex) };
    }));
  };

  const removeNewImage = (locationIndex, imageIndex) => {
    setLocations((prev) => prev.map((item, itemIndex) => {
      if (itemIndex !== locationIndex) return item;
      return { ...item, newImages: item.newImages.filter((_, idx) => idx !== imageIndex) };
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus((prev) => ({ ...prev, saving: true, error: '', success: '' }));
    try {
      const cleanedLocations = locations
        .map((item, index) => ({
          name: item.name,
          description: item.description,
          address: item.address,
          googleMapsLink: item.googleMapsLink,
          phone: item.phone,
          whatsappNumber: item.whatsappNumber,
          facebookLink: item.facebookLink,
          email: item.email,
          existingImages: item.existingImages || [],
          sortOrder: index,
        }))
        .filter((item) => item.name || item.description || item.address || item.phone || item.whatsappNumber || item.facebookLink || item.email || item.googleMapsLink || item.existingImages.length);

      const payload = toFormData({ businessLocations: cleanedLocations });
      locations.forEach((location, index) => {
        (location.newImages || []).slice(0, MAX_IMAGES_PER_LOCATION).forEach((file) => {
          payload.append(`businessLocationImages_${index}`, file);
        });
      });

      await updateProfile(payload);
      setStatus((prev) => ({ ...prev, success: 'تم حفظ بيانات الأماكن التجارية بنجاح.' }));
      setLocations((prev) => prev.map((item) => ({ ...item, newImages: [] })));
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  if (status.loading) {
    return (
      <div className={embedded ? 'stack-md profile-section-embedded' : 'stack-lg'}>
        <Card icon="fa-building"><p>جارٍ تحميل الأماكن التجارية...</p></Card>
      </div>
    );
  }

  return (
    <div className={embedded ? 'stack-md profile-section-embedded' : 'stack-lg'}>
      {!embedded ? (
        <PageHeader
          title="الأماكن التجارية"
          text="أضف أكثر من مكان مثل المنتجات، وكل مكان يمكن أن يحتوي على حتى 5 صور وبيانات التواصل الخاصة به."
          actions={<Button variant="secondary" onClick={addLocation}>إضافة مكان</Button>}
        />
      ) : null}
      <Card icon="fa-building">
        <div className="brand-pill">{status.currentPlan === 'PRO' ? 'باقة Pro مفعّلة' : 'جاهز للترقية إلى Pro'}</div>
        {embedded ? <div className="embedded-section-action"><Button variant="secondary" onClick={addLocation}>إضافة مكان</Button></div> : null}
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="stack-sm" style={{ marginBottom: 20 }}>
            <strong>عدد الأماكن المضافة:</strong> {filledLocationsCount || locations.length}
          </div>

          {locations.map((location, index) => {
            const totalImages = createLocationPreview(location);
            return (
              <div key={index} className="stack-md" style={{ padding: 16, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <strong>مكان تجاري #{index + 1}</strong>
                  <Button type="button" variant="ghost" onClick={() => removeLocation(index)}>حذف المكان</Button>
                </div>

                <div className="form-grid">
                  <label><span>اسم المكان</span><input value={location.name} onChange={(e) => updateLocation(index, 'name', e.target.value)} placeholder="اسم العمل / الفرع / المكان" /></label>
                  <label><span>رقم الهاتف</span><input value={location.phone} onChange={(e) => updateLocation(index, 'phone', e.target.value)} placeholder="010..." /></label>
                </div>

                <label><span>وصف المكان التجاري</span><textarea rows="4" value={location.description} onChange={(e) => updateLocation(index, 'description', e.target.value)} /></label>

                <div className="form-grid">
                  <label><span>العنوان النصي</span><input value={location.address} onChange={(e) => updateLocation(index, 'address', e.target.value)} /></label>
                  <label><span>رابط خرائط جوجل</span><input value={location.googleMapsLink} onChange={(e) => updateLocation(index, 'googleMapsLink', e.target.value)} placeholder="https://maps.google.com/..." /></label>
                </div>

                <div className="form-grid">
                  <label><span>رقم واتساب المكان</span><input value={location.whatsappNumber} onChange={(e) => updateLocation(index, 'whatsappNumber', e.target.value)} placeholder="2010..." /></label>
                  <label><span>رابط فيسبوك المكان</span><input value={location.facebookLink} onChange={(e) => updateLocation(index, 'facebookLink', e.target.value)} placeholder="https://facebook.com/..." /></label>
                </div>

                <div className="form-grid">
                  <label><span>البريد الإلكتروني للمكان</span><input value={location.email} onChange={(e) => updateLocation(index, 'email', e.target.value)} placeholder="branch@example.com" /></label>
                  <label>
                    <span>صور المكان التجاري ({totalImages}/{MAX_IMAGES_PER_LOCATION})</span>
                    <input type="file" accept="image/*" multiple onChange={(e) => handleImageChange(index, e.target.files)} />
                  </label>
                </div>

                {location.existingImages?.length ? (
                  <div className="stack-sm">
                    <span>الصور الحالية</span>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {location.existingImages.map((image, imageIndex) => (
                        <div key={image} style={{ position: 'relative' }}>
                          <img src={image} alt={`مكان ${index + 1}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12 }} />
                          <button type="button" onClick={() => removeExistingImage(index, imageIndex)} style={{ position: 'absolute', top: -6, left: -6, width: 24, height: 24, borderRadius: '50%', border: 'none', background: '#111', color: '#fff', cursor: 'pointer' }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {location.newImages?.length ? (
                  <div className="stack-sm">
                    <span>الصور الجديدة المختارة</span>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {location.newImages.map((file, imageIndex) => (
                        <div key={`${file.name}-${imageIndex}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 12, background: 'rgba(0,0,0,0.04)' }}>
                          <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                          <button type="button" onClick={() => removeNewImage(index, imageIndex)} style={{ border: 'none', background: 'transparent', color: '#b42318', cursor: 'pointer', fontWeight: 700 }}>حذف</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}

          {status.error ? <p className="error-text">{status.error}</p> : null}
          {status.success ? <p className="success-text">{status.success}</p> : null}
          <Button type="submit" disabled={status.saving}>{status.saving ? 'جارٍ الحفظ...' : 'حفظ الأماكن التجارية'}</Button>
        </form>
      </Card>
    </div>
  );
}
