import { translateDisplayValue } from '../../utils/display';

const toneMap = {
  active: 'success',
  approved: 'success',
  success: 'success',
  pending: 'warning',
  waiting_payment: 'warning',
  under_review: 'info',
  new: 'warning',
  inactive: 'warning',
  frozen: 'danger',
  rejected: 'danger',
  deleted: 'danger',
  info: 'info',
};

export default function Badge({ children, tone = 'default' }) {
  const cls = toneMap[tone] || tone;
  const content = typeof children === 'string' ? translateDisplayValue(children) : children;
  return <span className={`badge badge-${cls}`}>{content}</span>;
}
