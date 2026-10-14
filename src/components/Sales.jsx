import { useState } from 'react';
import {
  Search, Eye, XCircle, FileText, Calendar, Filter,
  ChevronLeft, ChevronRight, X, ShoppingCart, Download,
  Printer, Phone, User, RefreshCw, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTime } from '../utils/format';
import ReceiptModal from './ReceiptModal';

export default function Sales() {
  const { sales, cancelSale, exportSalesCSV, products, isShoeCategory, refreshData, backendOnline } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payFilter, setPayFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detailSale, setDetailSale] = useState(null);
  const [ticketSale, setTicketSale] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState('Devolución o cambio de talla / producto');
  const [cancelNotes, setCancelNotes] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

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

  const handleOpenCancelModal = (sale) => {
    setCancelConfirm(sale);
    setCancelReasonPreset('Devolución o cambio de talla / producto');
    setCancelNotes('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelConfirm) return;
    setIsCancelling(true);
    try {
      const finalReason = cancelNotes.trim()
        ? `${cancelReasonPreset}: ${cancelNotes.trim()}`
        : cancelReasonPreset;
      await cancelSale(cancelConfirm.id, finalReason);
      if (detailSale && detailSale.id === cancelConfirm.id) {
        setDetailSale(prev => ({
          ...prev,
          status: 'cancelled',
          cancelReason: finalReason,
          cancelledAt: new Date().toISOString(),
        }));
      }
      setCancelConfirm(null);
    } finally {
      setIsCancelling(false);
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
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Sincronizar y recargar ventas desde la base de datos Supabase"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin-icon' : ''} />
            {isRefreshing ? 'Sincronizando...' : 'Actualizar Ventas'}
          </button>
          <button className="btn btn-ghost" onClick={exportSalesCSV}>
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Pestañas Rápidas de Clasificación por Estado */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: `Todas las Ventas (${sales.length})` },
          { id: 'completed', label: `Completadas (${sales.filter(s => s.status === 'completed').length})` },
          { id: 'cancelled', label: `Canceladas / Anuladas (${sales.filter(s => s.status === 'cancelled').length})` },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`btn btn-sm ${statusFilter === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            style={statusFilter === tab.id ? { fontWeight: 700 } : {}}
            onClick={() => { setStatusFilter(tab.id); setPage(1); }}
          >
            {tab.label}
          </button>
        ))}
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
           </select>
        <select value={payFilter} onChange={e => { setPayFilter(e.target.value); setPage(1); }}>
          <option value="all">Todas las formas de pago</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Tarjeta">Tarjeta</option>
          <option value="Transferencia">Transferencia</option>
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
                    {s.status === 'cancelled' && s.cancelReason && (
                      <small
                        style={{
                          display: 'block',
                          color: '#f87171',
                          fontSize: '0.72rem',
                          marginTop: 3,
                          maxWidth: 160,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={s.cancelReason}
                      >
                        {s.cancelReason}
                      </small>
                    )}
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
                          title="Cancelar venta y reintegrar stock a inventario"
                          onClick={() => handleOpenCancelModal(s)}
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
              {detailSale.status === 'cancelled' && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}>
                  <XCircle size={22} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ color: '#f87171', display: 'block', fontSize: '0.98rem' }}>
                      VENTA CANCELADA / ANULADA
                    </strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Esta transacción fue anulada en el sistema. Los artículos y matriz de tallas fueron reincorporados al inventario.
                    </p>
                    {detailSale.cancelReason && (
                      <div style={{ marginTop: 6, fontSize: '0.85rem' }}>
                        <strong>Motivo de anulación:</strong>{' '}
                        <span style={{ color: 'var(--text-primary)' }}>{detailSale.cancelReason}</span>
                      </div>
                    )}
                    {detailSale.cancelledAt && (
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Fecha de anulación: {formatDateTime(detailSale.cancelledAt)}
                        {detailSale.cancelledBy ? ` · Responsable: ${detailSale.cancelledBy}` : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                      const colorText = item.color || prodObj?.color || '';
                      return (
                        <tr key={i}>
                          <td><code>{item.productCode}</code></td>
                          <td>
                            <strong>{item.productName}</strong>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
                              {sizeText && (
                                <span style={{ fontSize: '0.76rem', color: 'var(--accent-light)' }}>
                                  Talla: <strong>{item.selectedSize ? formatSizeDisplay(item.selectedSize) : sizeText}</strong>
                                </span>
                              )}
                              {colorText && (
                                <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                                  Color: <strong>{colorText}</strong>
                                </span>
                              )}
                            </div>
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
                              {colorText && (
                                <span className="badge badge-sm badge-secondary" style={{ fontWeight: 700 }}>
                                  Color: {colorText}
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
                        <span>Descuento al Mayoreo ({discInfo.wholesalePct}%):</span>
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
                          <span style={{ color: 'var(--text-secondary)' }}>Efectivo Recibido del Cliente:</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(receivedAmt)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>Cambio / Vuelto Entregado:</span>
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

      {/* Confirmar Cancelación con Motivo Auditado */}
      {cancelConfirm && (
        <div className="modal-overlay" onClick={() => !isCancelling && setCancelConfirm(null)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171' }}>
                <XCircle size={22} color="var(--danger)" /> Cancelar y Anular Venta
              </h2>
              <button className="icon-btn" disabled={isCancelling} onClick={() => setCancelConfirm(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.95rem', marginBottom: 12 }}>
                ¿Confirmas la anulación de la venta <strong>{cancelConfirm.saleNumber}</strong> por un total de{' '}
                <strong style={{ color: 'var(--accent-light)' }}>{formatCurrency(cancelConfirm.total)}</strong>?
              </p>

              <div style={{
                padding: 12,
                borderRadius: 8,
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: 'var(--accent-light)',
                fontSize: '0.84rem',
                marginBottom: 16,
                lineHeight: 1.45,
              }}>
                <strong>Reincorporación Automática al Stock:</strong> Las{' '}
                {cancelConfirm.items.reduce((s, i) => s + i.quantity, 0)} piezas de calzado / joyas vendidas
                serán devueltas inmediatamente al inventario (incluyendo el desglose exacto de tallas).
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                  Motivo Principal de Cancelación *
                </label>
                <select
                  value={cancelReasonPreset}
                  onChange={e => setCancelReasonPreset(e.target.value)}
                  style={{ width: '100%', padding: '10px' }}
                >
                  <option value="Devolución o cambio de talla / producto">Devolución o cambio de talla / producto</option>
                  <option value="Error en método de cobro o monto incorrecto">Error en método de cobro o monto incorrecto</option>
                  <option value="Cliente desistió de la compra">Cliente desistió de la compra</option>
                  <option value="Producto con detalle o defecto de fábrica">Producto con detalle o defecto de fábrica</option>
                  <option value="Venta de prueba / duplicada">Venta de prueba / duplicada</option>
                  <option value="Otro motivo">Otro motivo</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.82rem' }}>
                  Detalles u Observaciones Adicionales (Opcional):
                </label>
                <textarea
                  rows={2}
                  value={cancelNotes}
                  onChange={e => setCancelNotes(e.target.value)}
                  placeholder="Ej: Cliente solicitó cambio por otra talla / reingresado a estante..."
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={isCancelling}
                onClick={() => setCancelConfirm(null)}
              >
                No, volver
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {isCancelling ? (
                  <>
                    <RefreshCw size={16} className="spin-icon" /> Guardando en BD...
                  </>
                ) : (
                  <>
                    <XCircle size={16} /> Confirmar Anulación
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
