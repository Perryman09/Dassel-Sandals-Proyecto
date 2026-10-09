import { Printer, X, Tag } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export default function BarcodeModal({ product, onClose }) {
  if (!product) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header no-print">
          <h2><Tag size={18} /> Etiqueta de Producto</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <p className="no-print" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
            Etiqueta lista para imprimir y adherir al calzado, caja o joyero (Moneda: C$):
          </p>

          <div className="product-tag-card" id="printable-tag">
            <div className="tag-brand">DASSEL SANDALS</div>
            <div className="tag-category">
              {product.category === 'zapatos' ? '👡 CALZADO' : '💎 JOYERÍA'} — {product.subcategory}
            </div>

            <h3 className="tag-title">{product.name}</h3>

            <div className="tag-specs">
              {product.size && <div><strong>Tallas:</strong> {product.size}</div>}
              {product.color && <div><strong>Color:</strong> {product.color}</div>}
              {product.material && <div><strong>Material:</strong> {product.material}</div>}
            </div>

            <div className="tag-price">
              <span className="tag-amount" style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                {formatCurrency(product.salePrice)}
              </span>
            </div>

            <div className="barcode-simulation">
              <div className="barcode-graphic">
                <span style={{ width: 2 }}></span><span style={{ width: 1 }}></span><span style={{ width: 4 }}></span>
                <span style={{ width: 2 }}></span><span style={{ width: 1 }}></span><span style={{ width: 3 }}></span>
                <span style={{ width: 2 }}></span><span style={{ width: 4 }}></span><span style={{ width: 1 }}></span>
                <span style={{ width: 3 }}></span><span style={{ width: 2 }}></span><span style={{ width: 1 }}></span>
                <span style={{ width: 4 }}></span><span style={{ width: 2 }}></span><span style={{ width: 3 }}></span>
                <span style={{ width: 1 }}></span><span style={{ width: 2 }}></span><span style={{ width: 4 }}></span>
              </div>
              <div className="tag-sku">{product.code}</div>
            </div>
          </div>
        </div>

        <div className="modal-actions no-print">
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Imprimir Etiqueta
          </button>
        </div>
      </div>
    </div>
  );
}
