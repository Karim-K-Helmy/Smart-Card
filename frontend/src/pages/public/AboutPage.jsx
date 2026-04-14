import SectionTitle from '../../components/ui/SectionTitle';
import Card from '../../components/ui/Card';

export default function AboutPage() {
  return (
    <section className="section muted-section">
      <div className="container narrow stack-lg">
        <SectionTitle
          eyebrow="LineStart"
          title="من نحن"
          text="حل رقمي حديث يساعد الأفراد والشركات على تقديم هويتهم وخدماتهم بطريقة أكثر أناقة واحترافية."
        />

        <Card className="about-full-card" icon="fa-info">
          <p>
            LineStart منصة بطاقات ذكية صُممت لتسهّل مشاركة البيانات الشخصية والتجارية بطريقة سريعة، واضحة، ومتوافقة مع أسلوب العمل الحديث.
            نركّز على الدمج بين المظهر الاحترافي، سهولة الاستخدام، وسرعة الوصول إلى المعلومات، حتى تصبح البطاقة الرقمية أداة فعّالة في تقديمك المهني.
          </p>
        </Card>

        <div className="grid grid-2">
          <Card title="رؤيتنا" icon="fa-rocket">
            <p>
              تحويل البطاقة التقليدية إلى تجربة رقمية عالمية تليق برواد الأعمال والأفراد والشركات، مع تصميم متناسق يعمل بسلاسة على كل الأجهزة.
            </p>
          </Card>

          <Card title="ما الذي نقدمه؟" icon="fa-id-card">
            <p>
              بطاقات رقمية ذكية، لوحات تحكم سهلة، روابط تواصل منظمة، وعرض احترافي للخدمات أو الأعمال داخل صفحة واحدة واضحة وسريعة المشاركة.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
