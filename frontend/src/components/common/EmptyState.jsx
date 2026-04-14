import Button from '../ui/Button';
import { resolveIconClass } from '../../utils/icons';

export default function EmptyState({ title, text, buttonText, onClick, icon }) {
  const iconClass = resolveIconClass(icon || title);

  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        <i className={`fa-solid ${iconClass || 'fa-info'}`}></i>
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {buttonText ? <Button onClick={onClick}>{buttonText}</Button> : null}
    </div>
  );
}
