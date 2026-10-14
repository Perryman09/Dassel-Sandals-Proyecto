import {
  Eye, X, Tag, Package, Edit, Calendar, DollarSign,
  TrendingUp, CheckCircle, AlertTriangle, Layers, Shirt, Palette
} from 'lucide-react';
import { useApp, SHOE_SIZES_EUR, SHOE_SIZES_US } from '../context/AppContext';
import { formatCurrency } from '../utils/format';

export default function ProductDetailModal({ product, onClose, onEdit, onAdjust, onBarcode }) {
  const { isShoeCategory, getCategoryInfo } = useApp();
  if (!product) return null;

  // Helper para parsear sizesStock de forma segura
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

  const sizes = parseSizes(product);
  const isShoe = isShoeCategory(product);
  const catInfo = getCategoryInfo(product);
  const hasShoeSizes = isShoe && Object.keys(sizes).length > 0;

  const cost = Number(product.costPrice) || 0;
  const sale = Number(product.salePrice) || 0;
  const profit = Math.max(0, sale - cost);
  const profitMargin = cost > 0 ? ((profit / cost) * 100).toFixed(1) : '100';

  const isLowStock = Number(product.stock) <= Number(product.minStock);
  const isOut = Number(product.stock) === 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg product-detail-modal" onClick={e => e.stopPropagation()}>
        {/* ENCABEZADO */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="product-detail-icon-wrap">
              <Eye size={20} color="var(--accent)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 2 }}>{product.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <code style={{ fontSize: '0.8rem', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>
                  {product.code}
                </code>
                <span className={`badge badge-sm ${isShoe ? 'badge-info' : 'badge-purple'}`}>
                  {catInfo.icon} {catInfo.name} · {product.subcategory}
                </span>
                <span className={`badge badge-sm ${product.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                  {product.status === 'active' ? '● Activo' : '● Inactivo'}
                </span>
              </div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="modal-body" style={{ maxHeight: 'calc(85vh - 120px)', overflowY: 'auto', padding: '16px 20px' }}>
          {/* DESCRIPCIÓN */}
          <div className="product-detail-desc-card">
            <h4 style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, fontWeight: 700 }}>
              Descripción del Producto
            </h4>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
              {product.description || 'Sin descripción detallada registrada para este artículo.'}
            </p>
          </div>

          {/* FICHA TÉCNICA Y ESPECIFICACIONES */}
          <div className="product-detail-specs-grid">
            <div className="spec-item">
              <span className="spec-label">
                <Shirt size={14} color="var(--accent)" /> Material:
              </span>
              <strong className="spec-value">{product.material || 'No especificado'}</strong>
            </div>

            <div className="spec-item">
              <span className="spec-label">
                <Palette size={14} color="var(--accent)" /> Color:
              </span>
              <strong className="spec-value">{product.color || 'No especificado'}</strong>
            </div>

            <div className="spec-item">
              <span className="spec-label">
                <Layers size={14} color="var(--accent)" /> Rango de Tallas:
              </span>
              <strong className="spec-value">{product.size || 'Ver matriz de tallas'}</strong>
            </div>

            <div className="spec-item">
              <span className="spec-label">
                <Calendar size={14} color="var(--accent)" /> Fecha de Ingreso:
              </span>
              <strong className="spec-value">
                {product.createdAt ? new Date(product.createdAt).toLocaleDateString('es-NI', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
              </strong>
            </div>
          </div>

          {/* TARJETAS FINANCIERAS Y DE STOCK */}
          <div className="product-detail-metrics-grid">
            <div className="metric-card">
              <span className="metric-title">
                <Package size={14} /> Stock Total
              </span>
              <span className={`metric-number ${isOut ? 'danger' : isLowStock ? 'warning' : 'success'}`}>
                {product.stock} {isShoe ? 'pares' : 'pzas'}
              </span>
              <small className="metric-sub">
                Mínimo requerido: {product.minStock} {isShoe ? 'pares' : 'pzas'}
              </small>
            </div>

            <div className="metric-card">
              <span className="metric-title">
                <DollarSign size={14} /> Precio de Costo
              </span>
              <span className="metric-number">
                {formatCurrency(cost)}
              </span>
              <small className="metric-sub">Inversión unitaria</small>
            </div>

            <div className="metric-card">
              <span className="metric-title">
                <Tag size={14} /> Precio de Venta
              </span>
              <span className="metric-number" style={{ color: 'var(--accent)' }}>
                {formatCurrency(sale)}
              </span>
              <small className="metric-sub">Precio oficial público</small>
            </div>

            <div className="metric-card">
              <span className="metric-title">
                <TrendingUp size={14} /> Ganancia / Margen
              </span>
              <span className="metric-number" style={{ color: 'var(--success)' }}>
                +{formatCurrency(profit)}
              </span>
              <small className="metric-sub" style={{ color: 'var(--success)', fontWeight: 600 }}>
                Utilidad: +{profitMargin}%
              </small>
            </div>
          </div>

          {/* MATRIZ DE TALLAS DISPONIBLES (EUR & US) */}
          {hasShoeSizes && (
            <div className="product-detail-sizes-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers size={16} color="var(--accent)" /> Disponibilidad por Talla
                </h4>
                <small style={{ color: 'var(--text-muted)' }}>
                  Verde = Con existencia · Gris = Agotada
                </small>
              </div>

              {/* TALLAS EUROPEAS EUR */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.74rem' }}>
                    Tallas Europeas (EUR 35 al 42)
                  </span>
                </div>
                <div className="product-sizes-pill-grid">
                  {SHOE_SIZES_EUR.map(sz => {
                    const count = Number(sizes[sz]) || 0;
                    const hasStock = count > 0;
                    return (
                      <div key={`detail-eur-${sz}`} className={`detail-size-pill ${hasStock ? 'has-stock' : 'no-stock'}`}>
                        <span className="size-name">EUR #{sz}</span>
                        <strong className="size-count">
                          {hasStock ? `${count} pares` : 'Agotada'}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TALLAS AMERICANAS US */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className="badge badge-accent" style={{ fontSize: '0.74rem' }}>
                    Tallas Americanas (US 4 al 11)
                  </span>
                </div>
                <div className="product-sizes-pill-grid">
                  {SHOE_SIZES_US.map(sz => {
                    const count = Number(sizes[sz]) || 0;
                    const hasStock = count > 0;
                    return (
                      <div key={`detail-us-${sz}`} className={`detail-size-pill ${hasStock ? 'has-stock' : 'no-stock'}`}>
                        <span className="size-name">US #{sz}</span>
                        <strong className="size-count">
                          {hasStock ? `${count} pares` : 'Agotada'}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ACCIONES DEL MODAL */}
        <div className="modal-actions" style={{ justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {onBarcode && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  onClose();
                  onBarcode(product);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
              >
                <Tag size={15} /> Ver Código de Barras
              </button>
            )}

            {onAdjust && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  onClose();
                  onAdjust(product);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
              >
                <Package size={15} /> Ajustar Existencias
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  onEdit(product);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
              >
                <Edit size={15} /> Editar Producto
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
