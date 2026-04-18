import { useState } from 'react';
import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';
import Button from '../ui/Button';
import { sendMessage } from '../../services/api/messages';
import { extractApiError } from '../../utils/api';

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSent(false);
    setError('');
    setLoading(true);

    try {
      await sendMessage(form);
      setSent(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="section">
      <div className="container two-col">
        <div>
          <SectionTitle
            eyebrow="تواصل معنا"
            title="يسعدنا التواصل معك"
            text="أرسل استفسارك أو رسالتك وسنعود إليك عبر القنوات المتاحة في أقرب وقت."
          />

          <form className="form-card" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                <span>الاسم</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="الاسم الكامل"
                />
              </label>

              <label>
                <span>البريد الإلكتروني</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="أدخل بريدك الإلكتروني"
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                <span>رقم الهاتف</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="أدخل رقم الهاتف"
                />
              </label>

              <label>
                <span>الموضوع</span>
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="اكتب عنوان الرسالة"
                />
              </label>
            </div>

            <label>
              <span>الرسالة</span>
              <textarea
                rows="5"
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="اكتب رسالتك هنا"
              />
            </label>

            {error ? <p className="error-text">{error}</p> : null}

            <Button type="submit" disabled={loading}>
              <i className={`fa-solid ${loading ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
              {loading ? 'جارٍ الإرسال...' : 'إرسال الرسالة'}
            </Button>

            {sent ? <p className="success-text">تم إرسال الرسالة بنجاح.</p> : null}
          </form>
        </div>

        <Card title="بيانات التواصل" icon="fa-headset">
          <div className="contact-stack">
            <a className="contact-item-pro" href="mailto:line3.s.p.l@gmail.com">
              <span className="contact-item-icon"><i className="fa-solid fa-envelope"></i></span>
              <span>
                <span className="contact-item-label">البريد الإلكتروني</span>
                <span className="contact-item-value">line3.s.p.l@gmail.com</span>
              </span>
            </a>

            <a className="contact-item-pro" href="https://wa.me/201063877700" target="_blank" rel="noreferrer">
              <span className="contact-item-icon"><i className="fa-brands fa-whatsapp"></i></span>
              <span>
                <span className="contact-item-label">واتساب</span>
                <span className="contact-item-value">01063877700</span>
              </span>
            </a>

            <a className="contact-item-pro" href="https://t.me/linestartpro" target="_blank" rel="noreferrer">
              <span className="contact-item-icon"><i className="fa-brands fa-telegram-plane"></i></span>
              <span>
                <span className="contact-item-label">تيليجرام</span>
                <span className="contact-item-value">@linestartpro</span>
              </span>
            </a>

            <a className="contact-item-pro" href="https://www.facebook.com/share/1AxSA6W15P/" target="_blank" rel="noreferrer">
              <span className="contact-item-icon"><i className="fa-brands fa-facebook-f"></i></span>
              <span>
                <span className="contact-item-label">فيسبوك</span>
                <span className="contact-item-value">linestart</span>
              </span>
            </a>
          </div>
        </Card>
      </div>
    </section>
  );
}
