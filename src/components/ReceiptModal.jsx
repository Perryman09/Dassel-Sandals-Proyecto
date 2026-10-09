import { Printer, X, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/format';

export default function ReceiptModal({ sale, onClose }) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm receipt-modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header no-print">
          <h2><Printer size={18} /> Ticket de Venta (C$)</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body receipt-printable" id="printable-receipt">
          <div className="receipt-header">
            <div className="receipt-brand">DASSEL SANDALS</div>
            <div className="receipt-subtitle">Calzado &amp; Joyas Finas</div>
            <p className="receipt-info">Boutique &amp; Accesorios</p>
            <p className="receipt-info">RUC: J0310000123456</p>
            <p className="receipt-info">Nicaragua · Tel: +505 8899-1234</p>
          </div>

          <div className="receipt-divider">================================</div>

          <div className="receipt-meta">
            <div><span>FOLIO:</span> <strong>{sale.saleNumber}</strong></div>
            <div><span>FECHA:</span> {formatDateTime(sale.date)}</div>
            <div><span>CLIENTE:</span> {sale.customerName || 'Público General'}</div>
            {sale.customerPhone && <div><span>TEL:</span> {sale.customerPhone}</div>}
            <div><span>PAGO:</span> {sale.paymentMethod}</div>
          </div>

          <div className="receipt-divider">--------------------------------</div>

          <table className="receipt-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>DESCRIPCIÓN</th>
                <th style={{ textAlign: 'center' }}>CANT</th>
                <th style={{ textAlign: 'right' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {(sale.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="receipt-item-name">
                      {item.productName}
                      {item.selectedSize ? ` (Talla ${item.selectedSize})` : ''}
                    </div>
                    <small className="receipt-item-code">
                      {item.productCode} @ {formatCurrency(item.price)}
                    </small>
                  </td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="receipt-divider">--------------------------------</div>

          <div className="receipt-totals">
            <div className="receipt-total-row">
              <span>SUBTOTAL:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {Number(sale.discount) > 0 && (
              <div className="receipt-total-row">
                <span>DESCUENTO:</span>
                <span>-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="receipt-total-row grand-total">
              <span>TOTAL (C$):</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
            {sale.paymentMethod === 'Efectivo' && sale.receivedAmount && (
              <>
                <div className="receipt-total-row">
                  <span>EFECTIVO RECIBIDO:</span>
                  <span>{formatCurrency(sale.receivedAmount)}</span>
                </div>
                <div className="receipt-total-row change">
                  <span>CAMBIO:</span>
                  <span>{formatCurrency(Math.max(0, sale.receivedAmount - sale.total))}</span>
                </div>
              </>
            )}
          </div>

          <div className="receipt-divider">================================</div>

          <div className="receipt-footer">
            <p>¡Gracias por su compra en Dassel Sandals!</p>
            <p>Cambios dentro de los 7 días con este ticket.</p>
            <p>Calzado y Joyería con Encanto Artesanal ✨</p>
            <div className="barcode-sim">
              ||| | |||| | ||| || |||| | |||
            </div>
          </div>
        </div>

        <div className="modal-actions no-print">
          <button className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Imprimir Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
