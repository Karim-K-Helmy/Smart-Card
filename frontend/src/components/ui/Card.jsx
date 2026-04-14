import { resolveIconClass } from '../../utils/icons';

export default function Card({ title, action, className = '', children, icon }) {
  const iconClass = resolveIconClass(icon || title);

  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <div className="panel-head">
          {title ? (
            <h3 className={iconClass ? 'panel-title-with-icon' : ''}>
              {iconClass ? (
                <span className="panel-title-icon" aria-hidden="true">
                  <i className={`fa-solid ${iconClass}`}></i>
                </span>
              ) : null}
              <span>{title}</span>
            </h3>
          ) : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
