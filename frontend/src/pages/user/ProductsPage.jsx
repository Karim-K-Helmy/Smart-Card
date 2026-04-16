import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { createProduct, deleteProduct, getMyProducts, updateProduct } from '../../services/api/users';
import { extractApiError, toFormData } from '../../utils/api';

const MAX_PRODUCTS = 10;
const initialDraft = {
  name: '',
  description: '',
  price: '',
  sortOrder: 0,
  isVisible: true,
  productImage: null,
};

function formatCurrency(value) {
  if (value === undefined || value === null || value === '') return 'السعر عند الطلب';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  return new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(numeric) + ' ج.م';
}

export default function ProductsPage({ embedded = false }) {
  const { authState } = useAuth();
  const isPro = authState.user?.currentPlan === 'PRO';
  const [products, setProducts] = useState([]);
  const [draft, setDraft] = useState(initialDraft);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editDraft, setEditDraft] = useState(initialDraft);
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', success: '' });

  const visibleCount = useMemo(() => products.filter((item) => item.isVisible).length, [products]);
  const hasReachedLimit = products.length >= MAX_PRODUCTS;

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

  const handleFieldChange = (setter, key, value) => {
    setter((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (hasReachedLimit) {
      setStatus((prev) => ({ ...prev, error: `يمكنك إضافة ${MAX_PRODUCTS} منتجات كحد أقصى.`, success: '' }));
      return;
    }
    setStatus((prev) => ({ ...prev, saving: true, error: '', success: '' }));
    try {
      await createProduct(toFormData({
        name: draft.name,
        description: draft.description,
        price: draft.price === '' ? 0 : Number(draft.price),
        sortOrder: Number(draft.sortOrder || 0),
        isVisible: draft.isVisible,
        productImage: draft.productImage,
      }));
      setDraft(initialDraft);
      setStatus((prev) => ({ ...prev, success: 'تمت إضافة العمل بنجاح مع كل البيانات.' }));
      await load();
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditDraft({
      name: product.name || '',
      description: product.description || '',
      price: product.price ?? '',
      sortOrder: product.sortOrder ?? 0,
      isVisible: product.isVisible !== false,
      productImage: null,
    });
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingProduct) return;
    setStatus((prev) => ({ ...prev, saving: true, error: '', success: '' }));
    try {
      await updateProduct(editingProduct._id, toFormData({
        name: editDraft.name,
        description: editDraft.description,
        price: editDraft.price === '' ? 0 : Number(editDraft.price),
        sortOrder: Number(editDraft.sortOrder || 0),
        isVisible: editDraft.isVisible,
        productImage: editDraft.productImage,
      }));
      setStatus((prev) => ({ ...prev, success: 'تم تحديث بيانات العمل بنجاح.' }));
      setEditingProduct(null);
      setEditDraft(initialDraft);
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
      setStatus((prev) => ({ ...prev, success: 'تم حذف العمل.' }));
      await load();
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: extractApiError(error) }));
    }
  };

  if (!isPro) {
    return (
      <div className={embedded ? 'stack-md profile-section-embedded' : 'stack-lg'}>
        {!embedded ? <PageHeader title="الأعمال والمنتجات" text="هذا القسم مخصص لباقة Pro فقط." /> : null}
        <Card>
          <EmptyState title="القسم غير متاح" text="عند تفعيل Pro ستقدر تضيف أعمالك مع صورة وسعر ووصف، وتعدل القديم في أي وقت." />
        </Card>
      </div>
    );
  }

  return (
    <div className={embedded ? 'stack-md profile-section-embedded' : 'stack-lg'}>
      {!embedded ? <PageHeader title="الأعمال والمنتجات" text={`أضف أعمالك بصورة وسعر ووصف، وعدّل المنتجات القديمة بالكامل متى احتجت. الحد الأقصى ${MAX_PRODUCTS} منتجات.`} /> : null}

      <div className="products-dashboard-strip">
        <div className="mini-insight-card">
          <span>إجمالي الأعمال</span>
          <strong>{products.length} / {MAX_PRODUCTS}</strong>
        </div>
        <div className="mini-insight-card">
          <span>الظاهر في البطاقة</span>
          <strong>{visibleCount}</strong>
        </div>
      </div>

      {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}
      {status.success ? <Card><p className="success-text">{status.success}</p></Card> : null}

      <div className="grid grid-2 products-page-grid">
        <Card title="إضافة عمل جديد" className="products-form-card">
          <form className="form-card" onSubmit={handleSubmit}>
            <div className="form-helper-message">ℹ️ يمكنك ترك أي حقل فارغ، ولن يتم عرضه في صفحة عرض المنتج العامة.</div>
            {hasReachedLimit ? <p className="error-text">تم الوصول إلى الحد الأقصى المسموح به وهو {MAX_PRODUCTS} منتجات.</p> : null}
            <label><span>اسم المنتج</span><input value={draft.name} onChange={(e) => handleFieldChange(setDraft, 'name', e.target.value)} required disabled={hasReachedLimit} /></label>
            <label><span>وصف مختصر</span><textarea rows="3" maxLength="120" value={draft.description} onChange={(e) => handleFieldChange(setDraft, 'description', e.target.value)} disabled={hasReachedLimit} /></label>
            <div className="form-grid">
              <label><span>السعر</span><input type="number" min="0" value={draft.price} onChange={(e) => handleFieldChange(setDraft, 'price', e.target.value)} disabled={hasReachedLimit} /></label>
              <label><span>ترتيب العرض</span><input type="number" min="0" value={draft.sortOrder} onChange={(e) => handleFieldChange(setDraft, 'sortOrder', e.target.value)} disabled={hasReachedLimit} /></label>
            </div>
            <label><span>صورة العمل</span><input type="file" accept="image/*" onChange={(e) => handleFieldChange(setDraft, 'productImage', e.target.files?.[0] || null)} disabled={hasReachedLimit} /></label>
            <label className="checkbox-line"><input type="checkbox" checked={draft.isVisible} onChange={(e) => handleFieldChange(setDraft, 'isVisible', e.target.checked)} disabled={hasReachedLimit} /> إظهار العمل في البروفايل العام</label>
            <Button type="submit" disabled={status.saving || hasReachedLimit}>{status.saving ? 'جارٍ الحفظ...' : 'حفظ العمل'}</Button>
          </form>
        </Card>

        <Card title="قائمة الأعمال الحالية" className="products-list-card">
          {products.length ? (
            <div className="product-management-grid">
              {products.map((product) => (
                <article key={product._id} className="product-manage-card">
                  <div className="product-manage-media">
                    {product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <div className="product-manage-placeholder"><i className="fa-solid fa-image"></i></div>
                    )}
                  </div>
                  <div className="product-manage-copy">
                    <div className="product-manage-topline">
                      <strong>{product.name}</strong>
                      <Badge tone={product.isVisible ? 'success' : 'warning'}>{product.isVisible ? 'ظاهر' : 'مخفي'}</Badge>
                    </div>
                    <p>{product.description || 'بدون وصف.'}</p>
                    <div className="product-manage-meta">
                      <span>{formatCurrency(product.price)}</span>
                      <span>الترتيب: {product.sortOrder ?? 0}</span>
                    </div>
                    <div className="row-actions">
                      <Button variant="secondary" onClick={() => openEditModal(product)}>
                        <i className="fa-solid fa-pen"></i>
                        تعديل
                      </Button>
                      <Button variant="ghost" onClick={() => handleDelete(product._id)}>
                        <i className="fa-solid fa-trash"></i>
                        حذف
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="لا توجد أعمال" text={status.loading ? 'جارٍ التحميل...' : 'ابدأ بإضافة أول عمل وسيظهر هنا مع الصورة والسعر.'} />
          )}
        </Card>
      </div>

      <Modal
        open={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title="تعديل العمل"
        description="يمكنك تعديل كل البيانات القديمة بما فيها الصورة والسعر وظهور المنتج."
        footer={null}
      >
        <form className="form-card" onSubmit={handleUpdate}>
          <div className="form-helper-message">ℹ️ يمكنك ترك أي حقل فارغ، ولن يتم عرضه في صفحة عرض المنتج العامة.</div>
          <label><span>اسم المنتج</span><input value={editDraft.name} onChange={(e) => handleFieldChange(setEditDraft, 'name', e.target.value)} required /></label>
          <label><span>الوصف المختصر</span><textarea rows="3" maxLength="120" value={editDraft.description} onChange={(e) => handleFieldChange(setEditDraft, 'description', e.target.value)} /></label>
          <div className="form-grid">
            <label><span>السعر</span><input type="number" min="0" value={editDraft.price} onChange={(e) => handleFieldChange(setEditDraft, 'price', e.target.value)} /></label>
            <label><span>ترتيب العرض</span><input type="number" min="0" value={editDraft.sortOrder} onChange={(e) => handleFieldChange(setEditDraft, 'sortOrder', e.target.value)} /></label>
          </div>
          {editingProduct?.image ? (
            <div className="edit-product-preview">
              <img src={editingProduct.image} alt={editingProduct.name} />
              <span>الصورة الحالية</span>
            </div>
          ) : null}
          <label><span>تغيير الصورة</span><input type="file" accept="image/*" onChange={(e) => handleFieldChange(setEditDraft, 'productImage', e.target.files?.[0] || null)} /></label>
          <label className="checkbox-line"><input type="checkbox" checked={editDraft.isVisible} onChange={(e) => handleFieldChange(setEditDraft, 'isVisible', e.target.checked)} /> إظهار العمل في البروفايل العام</label>
          <div className="modal-form-actions">
            <Button type="button" variant="ghost" onClick={() => setEditingProduct(null)}>إلغاء</Button>
            <Button type="submit" disabled={status.saving}>{status.saving ? 'جارٍ التحديث...' : 'حفظ التعديلات'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
