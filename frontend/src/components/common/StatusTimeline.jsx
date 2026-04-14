const steps = ['pending', 'waiting_payment', 'under_review', 'approved'];
const labels = {
  pending: 'تم إنشاء الطلب',
  waiting_payment: 'انتظار الدفع',
  under_review: 'تحت المراجعة',
  approved: 'تم القبول',
  rejected: 'تم الرفض',
};

export default function StatusTimeline({ status }) {
  const rejected = status === 'rejected';
  const currentIndex = rejected ? 2 : Math.max(steps.indexOf(status), 0);

  return (
    <div className="timeline">
      {steps.map((step, index) => (
        <div key={step} className={`timeline-step ${index <= currentIndex ? 'active' : ''} ${rejected && index === 3 ? 'danger' : ''}`}>
          <div className="timeline-dot" />
          <span>{labels[step]}</span>
        </div>
      ))}
      {rejected ? <div className="timeline-rejected">تم رفض الطلب — يمكنك رفع وصل جديد بعد التعديل.</div> : null}
    </div>
  );
}
