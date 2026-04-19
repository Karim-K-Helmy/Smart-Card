import Button from './Button';
import Modal from './Modal';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  tone = 'danger',
  loading = false,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      wrapBody={false}
      title={title}
      description={description}
      footer={(
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>{cancelText}</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} size="sm" onClick={onConfirm} disabled={loading}>
            {loading ? 'جارٍ التنفيذ...' : confirmText}
          </Button>
        </>
      )}
    >
      {children}
    </Modal>
  );
}
