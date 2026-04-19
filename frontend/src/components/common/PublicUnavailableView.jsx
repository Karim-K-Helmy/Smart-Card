import { Link } from 'react-router-dom';

const illustration = encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420" fill="none">
    <rect width="640" height="420" rx="40" fill="#0b1220"/>
    <circle cx="120" cy="86" r="52" fill="#f97316" fill-opacity="0.18"/>
    <circle cx="540" cy="82" r="62" fill="#38bdf8" fill-opacity="0.16"/>
    <circle cx="516" cy="320" r="92" fill="#8b5cf6" fill-opacity="0.16"/>
    <rect x="118" y="88" width="404" height="244" rx="30" fill="#0f172a" stroke="rgba(255,255,255,.14)"/>
    <rect x="154" y="124" width="332" height="48" rx="16" fill="#111827" stroke="rgba(255,255,255,.08)"/>
    <rect x="154" y="190" width="210" height="18" rx="9" fill="#1f2937"/>
    <rect x="154" y="224" width="280" height="18" rx="9" fill="#1f2937"/>
    <rect x="154" y="258" width="238" height="18" rx="9" fill="#1f2937"/>
    <circle cx="458" cy="238" r="52" fill="#f97316" fill-opacity="0.12" stroke="#fb923c" stroke-width="3"/>
    <path d="M458 215a17 17 0 0 0-17 17v10h34v-10a17 17 0 0 0-17-17Zm-23 27h46c4.4 0 8 3.6 8 8v26c0 4.4-3.6 8-8 8h-46c-4.4 0-8-3.6-8-8v-26c0-4.4 3.6-8 8-8Z" fill="#fb923c"/>
    <path d="M492 126 426 302" stroke="#f87171" stroke-width="12" stroke-linecap="round"/>
  </svg>
`);

export default function PublicUnavailableView({
  badge = 'Profile Temporarily Unavailable',
  title = 'هذا الحساب غير متاح حالياً',
  message = 'لا يمكن عرض بيانات هذا الملف حالياً. يُرجى الرجوع إلى الإدارة للمزيد من التفاصيل.',
  note = 'This page is temporarily unavailable.',
  iconClass = 'fa-user-lock',
}) {
  const illustrationSrc = `data:image/svg+xml;charset=UTF-8,${illustration}`;

  return (
    <section className="public-unavailable-shell">
      <style>{`
        .public-unavailable-shell {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(249,115,22,.22), transparent 28%),
            radial-gradient(circle at top right, rgba(56,189,248,.22), transparent 26%),
            radial-gradient(circle at bottom right, rgba(139,92,246,.24), transparent 32%),
            linear-gradient(135deg, #020617 0%, #0f172a 48%, #111827 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 18px;
          direction: rtl;
        }
        .public-unavailable-shell * { box-sizing: border-box; }
        .public-unavailable-orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(24px);
          opacity: .55;
          pointer-events: none;
        }
        .public-unavailable-orb.one { width: 240px; height: 240px; background: rgba(249,115,22,.25); top: -40px; left: -20px; }
        .public-unavailable-orb.two { width: 320px; height: 320px; background: rgba(56,189,248,.18); right: -40px; top: 12%; }
        .public-unavailable-orb.three { width: 280px; height: 280px; background: rgba(139,92,246,.18); bottom: -60px; right: 16%; }
        .public-unavailable-card {
          position: relative;
          z-index: 1;
          width: min(1080px, 100%);
          display: grid;
          grid-template-columns: 1.05fr .95fr;
          gap: 28px;
          align-items: center;
          padding: 28px;
          border-radius: 32px;
          background: rgba(7, 13, 24, .78);
          border: 1px solid rgba(255,255,255,.08);
          box-shadow: 0 30px 80px rgba(0,0,0,.38);
          backdrop-filter: blur(20px);
          color: #fff;
        }
        .public-unavailable-copy { display: flex; flex-direction: column; gap: 18px; }
        .public-unavailable-badge {
          width: fit-content;
          max-width: 100%;
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(249,115,22,.14);
          border: 1px solid rgba(251,146,60,.28);
          color: #fdba74;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .04em;
        }
        .public-unavailable-icon {
          width: 84px;
          height: 84px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(249,115,22,.18), rgba(251,146,60,.08));
          border: 1px solid rgba(251,146,60,.24);
          color: #fb923c;
          font-size: 34px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
        }
        .public-unavailable-card h1 {
          margin: 0;
          font-size: clamp(32px, 4vw, 52px);
          line-height: 1.12;
          font-weight: 800;
        }
        .public-unavailable-card p {
          margin: 0;
          color: rgba(226,232,240,.86);
          font-size: 18px;
          line-height: 1.9;
        }
        .public-unavailable-note {
          color: rgba(148,163,184,.95);
          font-size: 14px;
          letter-spacing: .04em;
        }
        .public-unavailable-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
        .public-unavailable-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 48px;
          padding: 0 18px;
          border-radius: 16px;
          text-decoration: none;
          font-weight: 700;
          transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
          border: none;
          cursor: pointer;
          font: inherit;
        }
        .public-unavailable-btn.primary {
          background: linear-gradient(135deg, #f97316, #fb923c);
          color: #fff;
          box-shadow: 0 16px 32px rgba(249,115,22,.22);
        }
        .public-unavailable-btn.secondary {
          background: rgba(255,255,255,.04);
          color: #e2e8f0;
          border: 1px solid rgba(255,255,255,.08);
        }
        .public-unavailable-btn:hover { transform: translateY(-1px); }
        .public-unavailable-visual {
          position: relative;
          min-height: 340px;
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(15,23,42,.78), rgba(15,23,42,.38));
          border: 1px solid rgba(255,255,255,.06);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .public-unavailable-visual img {
          width: min(100%, 500px);
          max-width: 100%;
          display: block;
          object-fit: contain;
          filter: drop-shadow(0 20px 40px rgba(0,0,0,.3));
        }
        @media (max-width: 900px) {
          .public-unavailable-card { grid-template-columns: 1fr; padding: 24px; }
          .public-unavailable-visual { min-height: 260px; order: -1; }
        }
      `}</style>
      <div className="public-unavailable-orb one"></div>
      <div className="public-unavailable-orb two"></div>
      <div className="public-unavailable-orb three"></div>

      <div className="public-unavailable-card">
        <div className="public-unavailable-copy">
          <span className="public-unavailable-badge">{badge}</span>
          <span className="public-unavailable-icon"><i className={`fa-solid ${iconClass}`}></i></span>
          <h1>{title}</h1>
          <p>{message}</p>
          <div className="public-unavailable-note">{note}</div>
          <div className="public-unavailable-actions">
            <Link to="/" className="public-unavailable-btn primary"><i className="fa-solid fa-house"></i><span>العودة للرئيسية</span></Link>
            <button type="button" className="public-unavailable-btn secondary" onClick={() => window.history.back()}><i className="fa-solid fa-arrow-right"></i><span>الرجوع للصفحة السابقة</span></button>
          </div>
        </div>

        <div className="public-unavailable-visual">
          <img src={illustrationSrc} alt={badge} />
        </div>
      </div>
    </section>
  );
}
