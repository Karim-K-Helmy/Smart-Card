import { resolveIconClass } from '../../utils/icons';

export default function SectionTitle({ eyebrow, title, text, align = 'start', icon }) {
  const iconClass = resolveIconClass(icon || title || eyebrow);

  return (
    <div className={`section-title align-${align}`}>
      {eyebrow ? (
        <span className="eyebrow section-eyebrow">
          {iconClass ? <i className={`fa-solid ${iconClass}`} aria-hidden="true"></i> : null}
          <span>{eyebrow}</span>
        </span>
      ) : null}

      <div className="section-title-heading">
        {iconClass ? (
          <span className="section-title-icon" aria-hidden="true">
            <i className={`fa-solid ${iconClass}`}></i>
          </span>
        ) : null}
        <h2>{title}</h2>
      </div>

      {text ? <p>{text}</p> : null}
    </div>
  );
}
