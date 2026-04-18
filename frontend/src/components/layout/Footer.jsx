export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-col">
          <h4>
            <i className="fa-solid fa-id-card"></i>
            <span>linestart</span>
          </h4>
          <p>
            منصة بطاقات ذكية تساعدك على تقديم هويتك الرقمية وعرض بياناتك وخدماتك بأسلوب احترافي، سريع، ومتوافق مع مختلف الأجهزة.
          </p>

          <div className="footer-social">
            <a className="social-link" href="mailto:line3.s.p.l@gmail.com" aria-label="البريد الإلكتروني">
              <i className="fa-solid fa-envelope"></i>
            </a>
            <a className="social-link" href="https://wa.me/201063877700" target="_blank" rel="noreferrer" aria-label="واتساب">
              <i className="fa-brands fa-whatsapp"></i>
            </a>
            <a className="social-link" href="https://t.me/linestartpro" target="_blank" rel="noreferrer" aria-label="تيليجرام">
              <i className="fa-brands fa-telegram-plane"></i>
            </a>
            <a className="social-link" href="https://www.facebook.com/share/1AxSA6W15P/" target="_blank" rel="noreferrer" aria-label="فيسبوك">
              <i className="fa-brands fa-facebook-f"></i>
            </a>
          </div>
        </div>

        <div>
          <h5>
            <i className="fa-solid fa-link"></i>
            روابط سريعة
          </h5>
          <a href="/#home">
            <i className="fa-solid fa-house"></i>
            الرئيسية
          </a>
          <a href="/#about">
            <i className="fa-solid fa-info"></i>
            من نحن
          </a>
          <a href="/#pricing">
            <i className="fa-solid fa-layer-group"></i>
            الباقات
          </a>
          <a href="/#contact">
            <i className="fa-solid fa-envelope-open-text"></i>
            تواصل معنا
          </a>
        </div>

        <div>
          <h5>
            <i className="fa-solid fa-headset"></i>
            التواصل
          </h5>

          <a href="mailto:line3.s.p.l@gmail.com">
            <i className="fa-solid fa-envelope"></i>
            line3.s.p.l@gmail.com
          </a>

          <a href="https://wa.me/201063877700" target="_blank" rel="noreferrer">
            <i className="fa-brands fa-whatsapp"></i>
            واتساب
          </a>

          <a href="https://t.me/linestartpro" target="_blank" rel="noreferrer">
            <i className="fa-brands fa-telegram-plane"></i>
            تيليجرام
          </a>

          <a href="https://www.facebook.com/share/1AxSA6W15P/" target="_blank" rel="noreferrer">
            <i className="fa-brands fa-facebook-f"></i>
            فيسبوك
          </a>
        </div>
      </div>
    </footer>
  );
}
