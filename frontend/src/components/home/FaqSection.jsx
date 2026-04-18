import SectionTitle from '../ui/SectionTitle';
import Card from '../ui/Card';

const faqs = [
  ['ما هي البطاقة الذكية؟', 'بطاقة رقمية مرتبطة بملفك التعريفي ويمكن فتحها عبر QR أو رابط مباشر لعرض بياناتك بشكل احترافي.'],
  ['هل أستطيع تعديل بياناتي؟', 'نعم، من لوحة المستخدم يمكنك تعديل الحساب، البروفايل، الروابط، والأعمال بسهولة.'],
  ['كيف أرفع إيصال الدفع؟', 'بعد إنشاء الطلب يمكنك رفع صورة الإيصال من شاشة الطلب الموحدة ليتم مراجعته من لوحة الأدمن.'],
  ['هل تظهر الأعمال داخل نفس الصفحة؟', 'نعم، في باقة Pro يمكن عرض الأعمال أو المنتجات داخل نفس الصفحة العامة الخاصة بك.'],
];

export default function FaqSection() {
  return (
    <section id="faq" className="section">
      <div className="container narrow">
        <SectionTitle eyebrow="الأسئلة الشائعة" title="إجابات مختصرة لأهم الأسئلة" text="كل ما تحتاج معرفته قبل طلب البطاقة أو إدارة حسابك." />
        <div className="stack-lg">
          {faqs.map(([question, answer]) => (
            <Card key={question} title={question} icon="fa-question">
              <p>{answer}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
