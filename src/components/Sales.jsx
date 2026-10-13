import { useState } from 'react';
import {
  Search, Eye, XCircle, FileText, Calendar, Filter,
  ChevronLeft, ChevronRight, X, ShoppingCart, Download,
  Printer, Phone, User
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTime } from '../utils/format';
import ReceiptModal from './ReceiptModal';

export default function Sales() {
  const { sales, cancelSale, exportSalesCSV, products, isShoeCategory } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payFilter, setPayFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detailSale, setDetailSale] = useState(null);
  const [ticketSale, setTicketSale] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const formatSizeDisplay = (sz) => {
    if (!sz) return '';
    return Number(sz) >= 30 ? `EUR #${sz}` : `US #${sz}`;
  };

  const getSaleDiscountDetails = (sale) => {
    const sub = Number(sale?.subtotal) || 0;
    const disc = Number(sale?.discount) || 0;
    if (disc <= 0) return { hasDiscount: false, wholesalePct: 0, wholesaleAmt: 0, manualAmt: 0 };

    if (sale.wholesalePct && Number(sale.wholesalePct) > 0) {
      const wAmt = Number(sale.wholesaleDiscount) || ((sub * Number(sale.wholesalePct)) / 100);
      const mAmt = Math.max(0, disc - wAmt);
      return { hasDiscount: true, wholesalePct: Number(sale.wholesalePct), wholesaleAmt: wAmt, manualAmt: mAmt };
    }

    // Inferir si el descuento guardado corresponde a un porcentaje exacto de mayoreo (5%, 10%, 15%)
    if (sub > 0) {
      const pct = Math.round((disc / sub) * 100);
      if ([5, 10, 15].includes(pct) && Math.abs(disc - (sub * pct) / 100) < 1) {
        return { hasDiscount: true, wholesalePct: pct, wholesaleAmt: disc, manualAmt: 0 };
      }
    }

    return { hasDiscount: true, wholesalePct: 0, wholesaleAmt: 0, manualAmt: disc };
  };

  const filtered = [...sales]
    .filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        s.saleNumber.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.customerPhone && s.customerPhone.includes(q));
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchPay = payFilter === 'all' || s.paymentMethod === payFilter;
      let matchDate = true;
      if (dateFrom) matchDate = matchDate && s.date >= dateFrom;
      if (dateTo) matchDate = matchDate && s.date <= dateTo + 'T23:59:59';
      return matchSearch && matchStatus && matchPay && matchDate;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const totalRevenue = filtered.filter(s => s.status === 'completed').reduce((s, v) => s + v.total, 0);

  const handleCancel = (id) => {
    cancelSale(id);
    setCancelConfirm(null);
    if (detailSale && detailSale.id === id) {
      setDetailSale(prev => ({ ...prev, status: 'cancelled' }));
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Historial de Ventas</h1>
          <p>
            {sales.length} ventas en total · Ingresos en vista actual:{' '}
            <strong style={{ color: 'var(--success)' }}>{formatCurrency(totalRevenue)}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={exportSalesCSV}>
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <div className="search-input">
          <Search size={18} />
          <input
            placeholder="Buscar por # venta, cliente o teléfono..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="date-filter">
          <Calendar size={16} />
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
          <span>hasta</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">Todos los estados</option>
          <option value="completed">✅ Completada</option>
          <option value="cancelled">❌ Cancelada</option>
        </select>
        <select value={payFilter} onChange={e => { setPayFilter(e.target.value); setPage(1); }}>
          <option value="all">Todas las formas de pago</option>
          <option value="Efectivo">💵 Efectivo</option>
          <option value="Tarjeta">💳 Tarjeta</option>
          <option value="Transferencia">🏦 Transferencia</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Fecha &amp; Hora</th>
                <th>Cliente</th>
                <th>Artículos</th>
                <th>Total</th>
                <th>Método</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="empty-cell">No se encontraron registros de ventas</td></tr>
              ) : paginated.map(s => (
                <tr key={s.id} className={s.status === 'cancelled' ? 'row-inactive' : ''}>
                  <td><code>{s.saleNumber}</code></td>
                  <td>{formatDateTime(s.date)}</td>
                  <td>
                    <div>
                      <strong>{s.customerName || 'Cliente General'}</strong>
                      {s.customerPhone && (
                        <small style={{ display: 'block', color: 'var(--text-muted)' }}>{s.customerPhone}</small>
                      )}
                    </div>
                  </td>
                  <td>{s.items.reduce((sum, i) => sum + i.quantity, 0)} pzas</td>
                  <td><strong style={{ color: 'var(--accent-light)' }}>{formatCurrency(s.total)}</strong></td>
                  <td><span className="badge badge-outline">{s.paymentMethod}</span></td>
                  <td>
                    <span className={`badge ${s.status === 'completed' ? 'badge-success' : 'badge-danger'}`}>
                      {s.status === 'completed' ? 'Completada' : 'Cancelada'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns" style={{ justifyContent: 'center' }}>
                      <button
                        className="icon-btn"
                        title="Ver e imprimir ticket"
                        onClick={() => setTicketSale(s)}
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        title="Ver detalle completo"
                        onClick={() => setDetailSale(s)}
                      >
                        <Eye size={16} />
                      </button>
                      {s.status === 'completed' && (
                        <button
                          className="icon-btn danger"
                          title="Cancelar venta y reintegrar stock"
                          onClick={() => setCancelConfirm(s)}
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <span className="page-info">
              Mostrando {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} de {filtered.length} ventas
            </span>
            <div className="page-btns">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  className={page === i + 1 ? 'active' : ''}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detalle de Venta */}
      {detailSale && (
        <div className="modal-overlay" onClick={() => setDetailSale(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FileText size={20} /> Venta Folio {detailSale.saleNumber}</h2>
              <button className="icon-btn" onClick={() => setDetailSale(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="sale-detail-info">
                <div><strong>Cliente:</strong> {detailSale.customerName}</div>
                {detailSale.customerPhone && <div><strong>Teléfono:</strong> {detailSale.customerPhone}</div>}
                <div><strong>Fecha:</strong> {formatDateTime(detailSale.date)}</div>
                <div><strong>Método:</strong> {detailSale.paymentMethod}</div>
                <div>
                  <strong>Estado:</strong>{' '}
                  <span className={`badge ${detailSale.status === 'completed' ? 'badge-success' : 'badge-danger'}`}>
                    {detailSale.status === 'completed' ? 'Completada' : 'Cancelada'}
                  </span>
                </div>
              </div>

              <div className="table-wrapper" style={{ marginTop: 20 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Producto</th>
                      <th>Precio Unitario</th>
                      <th>Cantidad &amp; Talla</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailSale.items.map((item, i) => {
                      const prodObj = products.find(p => p.id === item.productId || p.code === item.productCode);
                      const isShoe = item.selectedSize || (prodObj && isShoeCategory(prodObj)) || String(item.productCode || '').startsWith('DS-ZAP');
                      const sizeText = item.selectedSize || (isShoe && prodObj?.size ? prodObj.size : '');
                      return (
                        <tr key={i}>
                          <td><code>{item.productCode}</code></td>
                          <td>
                            <strong>{item.productName}</strong>
                            {sizeText && (
                              <div style={{ fontSize: '0.76rem', color: 'var(--accent-light)', marginTop: 2 }}>
                                👠 Talla: <strong>{item.selectedSize ? formatSizeDisplay(item.selectedSize) : sizeText}</strong>
                              </div>
                            )}
                          </td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '1rem' }}>
                                {item.quantity} {isShoe ? (item.quantity === 1 ? 'par' : 'pares') : (item.quantity === 1 ? 'pza' : 'pzas')}
                              </strong>
                              {sizeText && (
                                <span className="badge badge-sm badge-info" style={{ fontWeight: 700 }}>
                                  Talla {item.selectedSize ? formatSizeDisplay(item.selectedSize) : sizeText}
                                </span>
                              )}
                            </div>
                          </td>
                          <td><strong style={{ color: 'var(--accent-light)' }}>{formatCurrency(item.subtotal)}</strong></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {(() => {
                const discInfo = getSaleDiscountDetails(detailSale);
                const receivedAmt = detailSale.receivedAmount ? Number(detailSale.receivedAmount) : (detailSale.paymentMethod === 'Efectivo' ? Number(detailSale.total) : 0);
                const changeAmt = detailSale.paymentMethod === 'Efectivo' ? Math.max(0, receivedAmt - Number(detailSale.total)) : 0;

                return (
                  <div className="sale-totals" style={{ marginTop: 18, padding: '14px 18px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="cart-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.92rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                      <strong>{formatCurrency(detailSale.subtotal)}</strong>
                    </div>

                    {discInfo.wholesaleAmt > 0 && (
                      <div className="cart-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.92rem', color: 'var(--accent-light)' }}>
                        <span>✨ Descuento al Mayoreo ({discInfo.wholesalePct}%):</span>
                        <strong style={{ color: 'var(--danger)' }}>-{formatCurrency(discInfo.wholesaleAmt)}</strong>
                      </div>
                    )}

                    {discInfo.manualAmt > 0 && (
                      <div className="cart-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.92rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {discInfo.wholesaleAmt > 0 ? 'Descuento Adicional:' : 'Descuento Aplicado:'}
                        </span>
                        <strong style={{ color: 'var(--danger)' }}>-{formatCurrency(discInfo.manualAmt)}</strong>
                      </div>
                    )}

                    {!discInfo.hasDiscount && (
                      <div className="cart-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span>Descuento al Mayoreo:</span>
                        <span>No aplicado (C$ 0.00)</span>
                      </div>
                    )}

                    <div className="cart-row total" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4, fontSize: '1.15rem', fontWeight: 800 }}>
                      <span>TOTAL COBRADO:</span>
                      <span style={{ color: 'var(--accent-light)', fontSize: '1.3rem' }}>{formatCurrency(detailSale.total)}</span>
                    </div>

                    {detailSale.paymentMethod === 'Efectivo' && (
                      <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 10, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.92rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>💵 Efectivo Recibido del Cliente:</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(receivedAmt)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>✅ Cambio / Vuelto Entregado:</span>
                          <strong style={{ color: 'var(--success)', fontSize: '1.05rem' }}>{formatCurrency(changeAmt)}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setTicketSale(detailSale);
                  setDetailSale(null);
                }}
              >
                <Printer size={16} /> Ver / Imprimir Ticket
              </button>
              <button className="btn btn-ghost" onClick={() => setDetailSale(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ticket Térmico */}
      {ticketSale && (
        <ReceiptModal
          sale={ticketSale}
          onClose={() => setTicketSale(null)}
        />
      )}

      {/* Confirmar Cancelación */}
      {cancelConfirm && (
        <div className="modal-overlay" onClick={() => setCancelConfirm(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><XCircle size={20} color="var(--danger)" /> Cancelar Venta</h2>
            </div>
            <div className="modal-body">
              <p>¿Seguro que deseas cancelar la venta <strong>{cancelConfirm.saleNumber}</strong>?</p>
              <div style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 8,
                background: 'var(--warning-bg)',
                color: 'var(--warning)',
                fontSize: '0.85rem'
              }}>
                ⚠️ Los productos de esta venta ({cancelConfirm.items.reduce((s, i) => s + i.quantity, 0)} unidades)
                se reincorporarán automáticamente al stock en inventario.
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setCancelConfirm(null)}>No, regresar</button>
              <button className="btn btn-danger" onClick={() => handleCancel(cancelConfirm.id)}>Sí, cancelar venta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
