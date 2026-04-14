import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { createProduct, deleteProduct, getMyProducts } from '../../services/api/users';
import { extractApiError } from '../../utils/api';

export default function ProductsPage() {
  const { authState } = useAuth();
  const isPro = authState.user?.currentPlan === 'PRO';
  const [products, setProducts] = useState([]);
  const [draft, setDraft] = useState({ name: '', description: '', sortOrder: 0, isVisible: true });
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', success: '' });

  const load = async () => {
    if (!isPro) {
      setStatus({ loading: false, saving: false, error: '', success: '' });
      return;
    }
    setStatus((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const { data } = await getMyProducts();
      setProducts(data.data || []);
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    } finally {
      setStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => { load(); }, [isPro]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus((prev) => ({ ...prev, saving: true, error: '', success: '' }));
    try {
      await createProduct({
        name: draft.name,
        description: draft.description,
        sortOrder: Number(draft.sortOrder || 0),
        isVisible: draft.isVisible,
      });
      setDraft({ name: '', description: '', sortOrder: 0, isVisible: true });
      setStatus((prev) => ({ ...prev, success: 'تمت إضافة العمل بنجاح.' }));
      await load();
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleDelete = async (productId) => {
    try {
      await deleteProduct(productId);
      await load();
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    }
  };

  if (!isPro) {
    return (
      <div className="stack-lg">
        <PageHeader title="الأعمال" text="هذا القسم مخصص لباقة Pro فقط." />
        <Card>
          <EmptyState title="قسم الأعمال غير متاح" text="عند طلب بطاقة Pro ستقدر تضيف أعمالك، وكل عمل يكون له اسم ووصف من سطر واحد." />
        </Card>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <PageHeader title="الأعمال" text="أضف أعمالك التي تريد ظهورها داخل بطاقة Pro. الوصف هنا مختصر في سطر واحد." />
      {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}
      <div className="grid grid-2">
        <Card title="إضافة عمل جديد">
          <form className="form-card" onSubmit={handleSubmit}>
            <label><span>اسم العمل</span><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required /></label>
            <label><span>وصف مختصر (سطر واحد)</span><input maxLength="120" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
            <div className="form-grid">
              <label><span>ترتيب العرض</span><input type="number" min="0" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} /></label>
              <label className="checkbox-line"><input type="checkbox" checked={draft.isVisible} onChange={(e) => setDraft({ ...draft, isVisible: e.target.checked })} /> إظهار العمل في البروفايل</label>
            </div>
            {status.success ? <p className="success-text">{status.success}</p> : null}
            <Button type="submit" disabled={status.saving}>{status.saving ? 'جارٍ الحفظ...' : 'حفظ العمل'}</Button>
          </form>
        </Card>
        <Card title="قائمة الأعمال">
          {products.length ? (
            <div className="stack-md">
              {products.map((product) => (
                <div key={product._id} className="product-row">
                  <div>
                    <strong>{product.name}</strong>
                    <p>{product.description || 'بدون وصف.'}</p>
                  </div>
                  <div className="row-actions align-end">
                    <Badge tone={product.isVisible ? 'success' : 'warning'}>{product.isVisible ? 'ظاهر' : 'مخفي'}</Badge>
                    <Button variant="ghost" onClick={() => handleDelete(product._id)}>حذف</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="لا توجد أعمال" text={status.loading ? 'جارٍ التحميل...' : 'ابدأ بإضافة أول عمل لعرضه في باقة Pro.'} />
          )}
        </Card>
      </div>
    </div>
  );
}