import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function SettingsPage() {
  return (
    <div className="stack-lg">
      <PageHeader title="الإعدادات" text="تم نقل تعديل البيانات الحساسة ونظام الأمان إلى صفحة الحساب، وتم تبسيط هذه الصفحة لتكون مرجعًا سريعًا." />
      <div className="grid grid-2">
        <Card title="الأمان والمصادقة">
          <div className="stack-md">
            <p>تسجيل الدخول يتم الآن عبر البريد الإلكتروني وكود تحقق.</p>
            <p>تعديل البيانات الحساسة أو كلمة المرور يتطلب إرسال كود إلى البريد قبل الحفظ.</p>
            <Link to="/dashboard/account"><Button>الانتقال إلى صفحة الحساب</Button></Link>
          </div>
        </Card>
        <Card title="الطلبات والإشعارات">
          <div className="stack-md">
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
