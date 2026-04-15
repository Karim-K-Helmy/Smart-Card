import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';

export default function AdminForgotPasswordPage() {
  return (
    <section className="auth-section">
      <Card className="auth-card" title="استعادة كلمة مرور الأدمن">
        <div className="form-card">
          <div className="notice-card notice-info">
            <strong>تنبيه</strong>
            <p>تم إيقاف استعادة كلمة مرور الأدمن من هذه الواجهة بعد إزالة نظام رموز التحقق من المشروع.</p>
            <p>يمكن تغيير كلمة المرور من إعدادات الأدمن باستخدام كلمة المرور الحالية فقط.</p>
          </div>
        </div>
        <div className="auth-links">
          <Link to="/admin/login">العودة لتسجيل دخول الأدمن</Link>
        </div>
      </Card>
    </section>
  );
}
