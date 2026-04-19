import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function SettingsPage() {
  return (
    <div className="stack-lg user-settings-page">
      <PageHeader
        title="الإعدادات"
        text="واجهة إعدادات أكثر احترافية مع الإبقاء على نفس البيانات الحالية دون أي حذف أو تغيير في المحتوى."
      />

      <div className="user-settings-hero-card">
        <div>
          <span className="settings-eyebrow">مركز التحكم السريع</span>
          <h2>إدارة الأمان والطلبات من تجربة أنيقة وواضحة</h2>
          <p>
            تم نقل تعديل البيانات الحساسة ونظام الأمان إلى صفحة الحساب، بينما تبقى هذه الصفحة مرجعًا سريعًا ومنظمًا للوصول إلى أهم الإعدادات داخل اللوحة.
          </p>
        </div>
        <div className="user-settings-hero-actions">
          <Link to="/dashboard/account"><Button>فتح صفحة الحساب</Button></Link>
          <Link to="/dashboard/notifications"><Button variant="ghost">عرض الإشعارات</Button></Link>
        </div>
      </div>

      <div className="grid grid-2 user-settings-grid">
        <Card title="الأمان والمصادقة" className="settings-feature-card">
          <div className="stack-md">
            <div className="settings-feature-icon"><i className="fa-solid fa-shield-heart"></i></div>
            <p>تسجيل الدخول يتم الآن عبر البريد الإلكتروني وكود تحقق.</p>
            <p>تعديل البيانات الحساسة أو كلمة المرور يتطلب إرسال كود إلى البريد قبل الحفظ.</p>
            <Link to="/dashboard/account"><Button>الانتقال إلى صفحة الحساب</Button></Link>
          </div>
        </Card>
        <Card title="الطلبات والإشعارات" className="settings-feature-card">
          <div className="stack-md">
            <div className="settings-feature-icon"><i className="fa-solid fa-bell-concierge"></i></div>
            <p>طلب البطاقة أصبح من خلال شاشة موحّدة تشمل اختيار الباقة ورفع الإيصال.</p>
            <p>يمكنك متابعة آخر الإشعارات وحالة الطلب من الصفحات المخصصة داخل اللوحة.</p>
            <div className="header-actions">
              <Link to="/dashboard/request-card"><Button variant="secondary">طلب بطاقة</Button></Link>
              <Link to="/dashboard/notifications"><Button variant="ghost">الإشعارات</Button></Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
