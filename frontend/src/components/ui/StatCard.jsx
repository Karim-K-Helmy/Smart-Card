import { resolveIconClass } from '../../utils/icons';
import { translateDisplayValue } from '../../utils/display';

export default function StatCard({ label, value, hint, icon }) {
  const iconClass = resolveIconClass(icon || label);
  const displayValue = typeof value === 'string' ? translateDisplayValue(value) : value;
  const displayHint = typeof hint === 'string' ? translateDisplayValue(hint) : hint;

  return (
    <div className="stat-card">
      {iconClass ? (
        <div className="stat-card-icon" aria-hidden="true">
          <i className={`fa-solid ${iconClass}`}></i>
        </div>
      ) : null}
      <span>{label}</span>
      <strong>{displayValue}</strong>
      {displayHint ? <small>{displayHint}</small> : null}
    </div>
  );
}
