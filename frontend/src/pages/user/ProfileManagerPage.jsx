import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import PersonalProfilePage from './PersonalProfilePage';
import BusinessProfilePage from './BusinessProfilePage';
import SocialLinksPage from './SocialLinksPage';
import ProductsPage from './ProductsPage';

const tabs = [
  { key: 'personal', label: 'البروفايل الشخصي', icon: 'fa-user-large' },
  { key: 'business', label: 'الأماكن التجارية', icon: 'fa-building' },
  { key: 'social', label: 'روابط السوشيال', icon: 'fa-share-nodes' },
  { key: 'products', label: 'الأعمال', icon: 'fa-briefcase' },
];

export default function ProfileManagerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'personal';

  const currentTab = useMemo(
    () => tabs.find((item) => item.key === activeTab) || tabs[0],
    [activeTab],
  );

  const renderTab = () => {
    switch (currentTab.key) {
      case 'business':
        return <BusinessProfilePage embedded />;
      case 'social':
        return <SocialLinksPage embedded />;
      case 'products':
        return <ProductsPage embedded />;
      case 'personal':
      default:
        return <PersonalProfilePage embedded />;
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader
        title="إدارة البروفايل"
        text="كل أقسام البروفايل أصبحت داخل صفحة واحدة. استخدم التبويبات العلوية للتنقل السريع بين البيانات الشخصية والتجارية وروابط السوشيال والأعمال."
        icon="fa-id-card-clip"
      />

      <div className="profile-manager-shell">
        <div className="profile-manager-tabs" role="tablist" aria-label="أقسام إدارة البروفايل">
          {tabs.map((tab) => {
            const isActive = currentTab.key === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`profile-manager-tab ${isActive ? 'is-active' : ''}`}
                onClick={() => setSearchParams({ tab: tab.key })}
              >
                <i className={`fa-solid ${tab.icon}`}></i>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="profile-manager-panel">
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
