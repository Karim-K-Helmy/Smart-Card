import Badge from '../ui/Badge';
import { resolveIconClass } from '../../utils/icons';

export default function PageHeader({ title, text, badge, actions, icon }) {
  const iconClass = resolveIconClass(icon || title);

  return (
    <div className="page-header">
      <div className="page-header-main">
        {iconClass ? (
          <span className="page-header-icon" aria-hidden="true">
            <i className={`fa-solid ${iconClass}`}></i>
          </span>
        ) : null}

        <div className="page-header-copy">
          <div className="page-header-title-row">
            <h1>{title}</h1>
            {badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : null}
          </div>
          {text ? <p>{text}</p> : null}
        </div>
      </div>

      {actions ? <div className="header-actions">{actions}</div> : null}
    </div>
  );
}
