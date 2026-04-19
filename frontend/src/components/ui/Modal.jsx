import { useEffect } from 'react';

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'lg',
  fullscreenOnMobile = true,
  dismissible = true,
  className = '',
  wrapBody = true,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && dismissible) {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, dismissible]);

  if (!open) return null;

  return (
    <div className="system-modal-overlay" onClick={dismissible ? onClose : undefined}>
      <div
        className={`system-modal-shell modal-size-${size} ${fullscreenOnMobile ? 'fullscreen-mobile' : ''} ${className}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="system-modal-title"
      >
        <div className="system-modal-header">
          <div>
            {title ? <h2 id="system-modal-title">{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {dismissible ? (
            <button type="button" className="system-modal-close" onClick={onClose} aria-label="إغلاق">
              <i className="fa-solid fa-xmark"></i>
            </button>
          ) : null}
        </div>

        {wrapBody ? <div className="system-modal-body">{children}</div> : children}

        {footer ? <div className="system-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
