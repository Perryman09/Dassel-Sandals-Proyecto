import { useState } from 'react';
import { X, Save, Layers } from 'lucide-react';
import { useApp, SUBCATEGORIES, SHOE_SIZES } from '../context/AppContext';

const emptyProduct = {
  name: '',
  category: 'zapatos',
  subcategory: '',
  description: '',
  costPrice: '',
  salePrice: '',
  stock: '',
  minStock: '5',
  size: '',
  sizesStock: {},
  material: '',
  color: '',
  status: 'active',
};

const parseSizes = (p) => {
  if (!p || !p.sizesStock) return {};
  let val = p.sizesStock;
  if (typeof val === 'string') {
    try {
      val = JSON.parse(val);
    } catch {
      val = {};
    }
  }
  if (typeof val === 'object' && val !== null) {
    return { ...val };
  }
  return {};
};

export default function ProductModal({ product, onClose, onSaved }) {
  const { addProduct, updateProduct, getNextCode } = useApp();
  const isEdit = !!product;

  const [form, setForm] = useState(() => {
    if (isEdit && product) {
      const parsedSizes = parseSizes(product);
      return {
        ...product,
        costPrice: String(product.costPrice ?? ''),
        salePrice: String(product.salePrice ?? ''),
        stock: String(product.stock ?? '0'),
        minStock: String(product.minStock ?? '5'),
        sizesStock: parsedSizes,
      };
    }
    return { ...emptyProduct, sizesStock: {} };
  });

  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'category') {
        next.subcategory = '';
        next.size = '';
        if (value === 'joyas') {
          next.sizesStock = {};
        }
      }
      return next;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  // Manejo de la matriz de tallas para zapatos
  const handleSizeStockChange = (size, qtyStr) => {
    const qty = Math.max(0, parseInt(qtyStr, 10) || 0);
    const updatedSizes = {
      ...(form.sizesStock || {}),
      [size]: qty,
    };

    // Calcular el stock total como la suma de las tallas
    const totalFromSizes = Object.values(updatedSizes).reduce((acc, n) => acc + (Number(n) || 0), 0);

    setForm(prev => ({
      ...prev,
      sizesStock: updatedSizes,
      stock: String(totalFromSizes),
    }));

    if (errors.stock) setErrors(prev => ({ ...prev, stock: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Requerido';
    if (!form.subcategory) e.subcategory = 'Requerido';
    if (!form.costPrice || isNaN(Number(form.costPrice)) || Number(form.costPrice) <= 0)
      e.costPrice = 'Ingresa un precio válido en C$';
    if (!form.salePrice || isNaN(Number(form.salePrice)) || Number(form.salePrice) <= 0)
      e.salePrice = 'Ingresa un precio válido en C$';
    if (!isEdit && (form.stock === '' || isNaN(Number(form.stock)) || Number(form.stock) < 0))
      e.stock = 'Requerido';
    if (!form.minStock || isNaN(Number(form.minStock)) || Number(form.minStock) < 0)
      e.minStock = 'Requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const hasSizes = form.category === 'zapatos' && form.sizesStock && Object.keys(form.sizesStock).length > 0;
    const totalFromSizes = hasSizes
      ? Object.values(form.sizesStock).reduce((acc, n) => acc + (Number(n) || 0), 0)
      : Number(form.stock) || 0;

    let computedSize = form.size;
    if (form.category === 'zapatos' && hasSizes) {
      const activeSizes = Object.entries(form.sizesStock)
        .filter(([_, q]) => Number(q) > 0)
        .map(([sz]) => sz)
        .sort((a, b) => Number(a) - Number(b));
      if (activeSizes.length > 0 && !computedSize) {
        computedSize = activeSizes.length === 1 ? `Talla ${activeSizes[0]}` : `${activeSizes[0]}-${activeSizes[activeSizes.length - 1]}`;
      }
    }

    const data = {
      ...form,
      costPrice: Number(form.costPrice),
      salePrice: Number(form.salePrice),
      stock: totalFromSizes,
      minStock: Number(form.minStock) || 5,
      size: computedSize || '',
      sizesStock: form.category === 'zapatos' ? (hasSizes ? form.sizesStock : null) : null,
    };

    if (isEdit) {
      await updateProduct(product.id, data);
      if (onSaved) onSaved({ type: 'update', product: { ...product, ...data } });
    } else {
      data.code = getNextCode(form.category);
      data.createdAt = new Date().toISOString().split('T')[0];
      await addProduct(data);
      if (onSaved) onSaved({ type: 'create', product: data });
    }
    onClose();
  };

  const subs = SUBCATEGORIES[form.category] || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {isEdit && (
              <div className="form-group">
                <label>Código Asignado</label>
                <input value={form.code} disabled className="input-disabled" />
              </div>
            )}
            {!isEdit && (
              <div className="form-row info-banner">
                <p>
                  📋 Folio automático: <strong>{getNextCode(form.category)}</strong> · Moneda oficial: <strong>Córdobas (C$)</strong>
                </p>
              </div>
            )}

            <div className="form-row">
              <div className="form-group flex-2">
                <label>Nombre del Producto *</label>
                <input
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Ej: Sandalia Maya Artesanal"
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Categoría *</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}>
                  <option value="zapatos">👡 Zapatos &amp; Sandalias</option>
                  <option value="joyas">💎 Joyas &amp; Accesorios</option>
                </select>
              </div>
              <div className="form-group">
                <label>Subcategoría *</label>
                <select value={form.subcategory} onChange={e => set('subcategory', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {subs.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.subcategory && <span className="field-error">{errors.subcategory}</span>}
              </div>
            </div>

            {/* MATRIZ DE TALLAS PARA CALZADO */}
            {form.category === 'zapatos' && (
              <div className="shoe-sizes-matrix-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--accent)' }}>
                    <Layers size={16} /> Matriz de Tallas (Existencias por número)
                  </label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Total calculado: <strong>{form.stock || 0} pares</strong>
                  </span>
                </div>
                <div className="shoe-sizes-matrix-grid">
                  {SHOE_SIZES.map(sz => (
                    <div key={sz} className="shoe-size-cell">
                      <span className="size-label"># {sz}</span>
                      <input
                        type="number"
                        min="0"
                        value={form.sizesStock?.[sz] !== undefined ? form.sizesStock[sz] : ''}
                        onChange={e => handleSizeStockChange(sz, e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Material</label>
                <input
                  value={form.material}
                  onChange={e => set('material', e.target.value)}
                  placeholder="Ej: Cuero sintético, Yute, Plata"
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input
                  value={form.color}
                  onChange={e => set('color', e.target.value)}
                  placeholder="Ej: Beige, Dorado, Negro"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Detalles sobre diseño, materiales o estilo..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Precio de Costo (C$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.costPrice}
                  onChange={e => set('costPrice', e.target.value)}
                  placeholder="C$ 0.00"
                />
                {errors.costPrice && <span className="field-error">{errors.costPrice}</span>}
              </div>
              <div className="form-group">
                <label>Precio de Venta (C$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.salePrice}
                  onChange={e => set('salePrice', e.target.value)}
                  placeholder="C$ 0.00"
                />
                {errors.salePrice && <span className="field-error">{errors.salePrice}</span>}
              </div>
              {form.category !== 'zapatos' && (
                <div className="form-group">
                  <label>Stock Total *</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={e => set('stock', e.target.value)}
                    placeholder="0"
                  />
                  {errors.stock && <span className="field-error">{errors.stock}</span>}
                </div>
              )}
              <div className="form-group">
                <label>Stock Mínimo (Alerta) *</label>
                <input
                  type="number"
                  value={form.minStock}
                  onChange={e => set('minStock', e.target.value)}
                  placeholder="5"
                />
                {errors.minStock && <span className="field-error">{errors.minStock}</span>}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> {isEdit ? 'Guardar Cambios' : 'Registrar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
