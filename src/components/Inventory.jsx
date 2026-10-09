import { useState, useEffect } from 'react';
import {
  Search, Plus, Edit, Trash2, ArrowUp, ArrowDown, Filter,
  Package, AlertTriangle, XCircle, Minus, ChevronLeft, ChevronRight,
  Download, Tag, History, Layers, CheckCircle, X
} from 'lucide-react';
import { useApp, SHOE_SIZES } from '../context/AppContext';
import { formatCurrency } from '../utils/format';
import ProductModal from './ProductModal';
import BarcodeModal from './BarcodeModal';
import MovementsModal from './MovementsModal';

export default function Inventory() {
  const { products, deleteProduct, adjustStock, exportProductsCSV } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortField, setSortField] = useState('code');
  const [sortDir, setSortDir] = useState('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Recepción de mercancía / Proveedor');
  const [adjustSelectedSize, setAdjustSelectedSize] = useState('24');
  const [adjustMode, setAdjustMode] = useState('single');
  const [multiAdjustSizes, setMultiAdjustSizes] = useState({});
  const [notification, setNotification] = useState(null);
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [showMovements, setShowMovements] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const showNotification = (text, type = 'success') => {
    setNotification({ text, type });
  };

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4500);
    return () => clearTimeout(timer);
  }, [notification]);

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

  const openAdjustModal = (product) => {
    setAdjustModal(product);
    setAdjustQty('');
    setAdjustReason('Recepción de mercancía / Proveedor');
    setAdjustMode('single');
    const sizes = parseSizes(product);
    const availableSizes = Object.keys(sizes).filter(sz => Number(sizes[sz]) > 0);
    setAdjustSelectedSize(availableSizes.length > 0 ? availableSizes[0] : (SHOE_SIZES[4] || '24'));
    setMultiAdjustSizes({});
  };

  const filtered = products
    .filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.color && p.color.toLowerCase().includes(q)) ||
        (p.material && p.material.toLowerCase().includes(q));
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      let matchStock = true;
      if (stockFilter === 'out') matchStock = p.stock === 0;
      else if (stockFilter === 'low') matchStock = p.stock > 0 && p.stock <= p.minStock;
      else if (stockFilter === 'ok') matchStock = p.stock > p.minStock;
      return matchSearch && matchCat && matchStatus && matchStock;
    })
    .sort((a, b) => {
      let va = a[sortField], vb = b[sortField];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const getStockBadge = (p) => {
    if (p.stock === 0) return <span className="badge badge-danger">Agotado</span>;
    if (p.stock <= p.minStock) return <span className="badge badge-warning">Stock Bajo</span>;
    return <span className="badge badge-success">Suficiente</span>;
  };

  const handleDelete = (product) => {
    deleteProduct(product.id);
    setDeleteConfirm(null);
    showNotification(`🗑️ Producto "${product.name}" (${product.code}) eliminado del inventario.`);
  };

  const handleAdjust = async () => {
    if (!adjustModal) return;

    if (adjustModal.category === 'zapatos') {
      if (adjustMode === 'single') {
        const qty = parseInt(adjustQty, 10);
        if (isNaN(qty) || qty === 0) return;
        await adjustStock(adjustModal.id, qty, adjustReason, adjustSelectedSize);
        const sign = qty > 0 ? `+${qty}` : `${qty}`;
        showNotification(`✅ Existencias de ${adjustModal.name} (Talla #${adjustSelectedSize}) ajustadas (${sign} pares).`);
      } else {
        const entries = Object.entries(multiAdjustSizes).filter(([_, d]) => d !== '' && parseInt(d, 10) !== 0);
        if (entries.length === 0) return;

        const currentSizes = parseSizes(adjustModal);
        const newSizes = { ...currentSizes };
        let totalDelta = 0;
        entries.forEach(([sz, deltaStr]) => {
          const delta = parseInt(deltaStr, 10) || 0;
          newSizes[sz] = Math.max(0, (Number(newSizes[sz]) || 0) + delta);
          totalDelta += delta;
        });

        const newTotal = Object.values(newSizes).reduce((a, b) => a + (Number(b) || 0), 0);
        await adjustStock(adjustModal.id, totalDelta, adjustReason, null, newSizes);
        showNotification(`✅ Matriz de tallas de ${adjustModal.name} actualizada (${totalDelta >= 0 ? `+${totalDelta}` : totalDelta} pares, Total: ${newTotal} pares).`);
      }
    } else {
      const qty = parseInt(adjustQty, 10);
      if (isNaN(qty) || qty === 0) return;
      await adjustStock(adjustModal.id, qty, adjustReason);
      const sign = qty > 0 ? `+${qty}` : `${qty}`;
      showNotification(`✅ Existencias de ${adjustModal.name} ajustadas (${sign} unidades).`);
    }

    setAdjustModal(null);
    setAdjustQty('');
    setMultiAdjustSizes({});
  };

  return (
    <div className="page">
      {/* ALERTA / TOAST DE NOTIFICACIÓN DE INVENTARIO */}
      {notification && (
        <div className="inventory-notification-toast">
          <CheckCircle size={20} color="var(--accent)" />
          <span>{notification.text}</span>
          <button
            onClick={() => setNotification(null)}
            className="icon-btn small"
            style={{ marginLeft: 8 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>Control de Inventario</h1>
          <p>
            {products.length} productos registrados ·{' '}
            {products.reduce((s, p) => s + p.stock, 0)} unidades en almacén
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={() => setShowMovements(true)}>
            <History size={16} /> Movimientos (Kardex)
          </button>
          <button className="btn btn-ghost" onClick={exportProductsCSV}>
            <Download size={16} /> Exportar CSV
          </button>
          <button className="btn btn-primary" onClick={() => { setEditProduct(null); setModalOpen(true); }}>
            <Plus size={18} /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filtros de Inventario */}
      <div className="filters-bar">
        <div className="search-input">
          <Search size={18} />
          <input
            placeholder="Buscar por nombre, código, color, material..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="all">Todas las categorías</option>
          <option value="zapatos">👡 Zapatos y Sandalias</option>
          <option value="joyas">💎 Joyería y Accesorios</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        <select value={stockFilter} onChange={e => { setStockFilter(e.target.value); setPage(1); }}>
          <option value="all">Todo el stock</option>
          <option value="ok">✅ Normal / Suficiente</option>
          <option value="low">⚠️ Stock Bajo</option>
          <option value="out">❌ Agotados</option>
        </select>
      </div>

      {/* Tabla de Productos */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th onClick={() => handleSort('code')} className="sortable">Código <SortIcon field="code" /></th>
                <th onClick={() => handleSort('name')} className="sortable">Producto / Modelo <SortIcon field="name" /></th>
                <th onClick={() => handleSort('category')} className="sortable">Categoría <SortIcon field="category" /></th>
                <th onClick={() => handleSort('costPrice')} className="sortable">P. Costo <SortIcon field="costPrice" /></th>
                <th onClick={() => handleSort('salePrice')} className="sortable">P. Venta <SortIcon field="salePrice" /></th>
                <th onClick={() => handleSort('stock')} className="sortable">Existencias <SortIcon field="stock" /></th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-cell">
                    No se encontraron productos que coincidan con la búsqueda o filtro
                  </td>
                </tr>
              ) : paginated.map(p => (
                <tr key={p.id} className={p.status === 'inactive' ? 'row-inactive' : ''}>
                  <td>
                    <code>{p.code}</code>
                  </td>
                  <td>
                    <div className="product-cell">
                      <strong>{p.name}</strong>
                      <small>
                        {p.subcategory}
                        {p.color ? ` · Color: ${p.color}` : ''}
                        {p.material ? ` · ${p.material}` : ''}
                      </small>
                      {p.category === 'zapatos' && p.sizesStock && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                          {Object.entries(p.sizesStock)
                            .filter(([, qty]) => Number(qty) > 0)
                            .map(([sz, qty]) => (
                              <span key={sz} className="badge badge-sm badge-info" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                                #{sz}: {qty}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${p.category === 'zapatos' ? 'badge-info' : 'badge-purple'}`}>
                      {p.category === 'zapatos' ? '👡 Zapatos' : '💎 Joyas'}
                    </span>
                  </td>
                  <td>{formatCurrency(p.costPrice)}</td>
                  <td>
                    <strong style={{ color: 'var(--accent-light)' }}>{formatCurrency(p.salePrice)}</strong>
                  </td>
                  <td>
                    <div className="stock-cell">
                      <strong style={{ fontSize: '1rem' }}>{p.stock}</strong>
                      {getStockBadge(p)}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-muted'}`}>
                      {p.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns" style={{ justifyContent: 'center' }}>
                      <button
                        className="icon-btn"
                        title="Ver e imprimir etiqueta de código de barras"
                        onClick={() => setBarcodeProduct(p)}
                      >
                        <Tag size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        title="Ajustar existencias rápidamente"
                        onClick={() => openAdjustModal(p)}
                      >
                        <Package size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        title="Editar información del producto"
                        onClick={() => { setEditProduct(p); setModalOpen(true); }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="icon-btn danger"
                        title="Eliminar producto"
                        onClick={() => setDeleteConfirm(p)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="pagination">
            <span className="page-info">
              Mostrando {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} de {filtered.length} productos
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

      {/* Modal Crear / Editar Producto */}
      {modalOpen && (
        <ProductModal
          product={editProduct}
          onClose={() => { setModalOpen(false); setEditProduct(null); }}
          onSaved={({ type, product: p }) => {
            showNotification(
              type === 'create'
                ? `✅ Producto "${p.name}" (${p.code}) agregado exitosamente con ${p.stock} unidades.`
                : `✅ Producto "${p.name}" (${p.code}) actualizado exitosamente (Stock: ${p.stock}).`
            );
          }}
        />
      )}

      {/* Modal Etiqueta de Precio / Barcode */}
      {barcodeProduct && (
        <BarcodeModal
          product={barcodeProduct}
          onClose={() => setBarcodeProduct(null)}
        />
      )}

      {/* Modal Historial de Movimientos Kardex */}
      {showMovements && (
        <MovementsModal
          onClose={() => setShowMovements(false)}
        />
      )}

      {/* Confirmación para Eliminar */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Trash2 size={20} color="var(--danger)" /> Eliminar Producto</h2>
              <button className="icon-btn" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de eliminar permanentemente <strong>{deleteConfirm.name}</strong>?</p>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '0.85rem' }}>
                Código: <code>{deleteConfirm.code}</code> · Stock actual: {deleteConfirm.stock} pzas
              </p>
              {deleteConfirm.category === 'zapatos' && deleteConfirm.sizesStock && (
                <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Se eliminarán también las existencias registradas de su matriz de tallas.
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajuste Inteligente de Existencias (con soporte para Tallas y Kardex) */}
      {adjustModal && (
        <div className="modal-overlay" onClick={() => setAdjustModal(null)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Package size={20} color="var(--accent)" />
                Ajustar Existencias: {adjustModal.name}
              </h2>
              <button className="icon-btn" onClick={() => setAdjustModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Código: <code>{adjustModal.code}</code> · Tipo: <strong>{adjustModal.category === 'zapatos' ? '👡 Calzado' : '💎 Joyería'}</strong>
                </span>
                <span className="badge badge-info" style={{ fontSize: '0.85rem' }}>
                  Stock actual: {adjustModal.stock} {adjustModal.category === 'zapatos' ? 'pares' : 'piezas'}
                </span>
              </div>

              {/* SI ES CALZADO: OPCIÓN DE AJUSTAR POR TALLA O MATRIZ COMPLETA */}
              {adjustModal.category === 'zapatos' ? (
                <div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${adjustMode === 'single' ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setAdjustMode('single')}
                    >
                      Ajustar una Talla Específica
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${adjustMode === 'matrix' ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setAdjustMode('matrix')}
                    >
                      <Layers size={14} /> Ajustar Varias Tallas
                    </button>
                  </div>

                  {adjustMode === 'single' ? (
                    <div>
                      <div className="form-group">
                        <label>Seleccionar Número / Talla a Ajustar</label>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                          {SHOE_SIZES.map(sz => {
                            const curStock = parseSizes(adjustModal)[sz] ?? 0;
                            const isSelected = adjustSelectedSize === sz;
                            return (
                              <button
                                key={sz}
                                type="button"
                                className={`cat-tab ${isSelected ? 'active' : ''}`}
                                style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                                onClick={() => setAdjustSelectedSize(sz)}
                              >
                                #{sz} ({curStock} pzas)
                              </button>
                            );
                          })}
                        </div>
                        <small style={{ color: 'var(--text-muted)' }}>
                          Existencia actual de <strong>Talla #{adjustSelectedSize}</strong>: {parseSizes(adjustModal)[adjustSelectedSize] ?? 0} pares
                        </small>
                      </div>

                      <div className="form-group">
                        <label>Cantidad a sumar (+) o restar (-)</label>
                        <input
                          type="number"
                          value={adjustQty}
                          onChange={e => setAdjustQty(e.target.value)}
                          placeholder="Ej: +5 (ingreso) o -2 (merma)"
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          {[1, 2, 5, 10].map(n => (
                            <button
                              key={`+${n}`}
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                              onClick={() => setAdjustQty(String(n))}
                            >
                              +{n} pares
                            </button>
                          ))}
                          {[-1, -2, -5].map(n => (
                            <button
                              key={`${n}`}
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: '2px 8px', fontSize: '0.75rem', color: 'var(--danger)' }}
                              onClick={() => setAdjustQty(String(n))}
                            >
                              {n} pares
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Preview de resultado por talla */}
                      {adjustQty && !isNaN(parseInt(adjustQty, 10)) && (
                        <div style={{
                          padding: 10,
                          borderRadius: 8,
                          background: 'var(--bg-tertiary)',
                          marginBottom: 12,
                          fontSize: '0.85rem'
                        }}>
                          <div>
                            Talla #{adjustSelectedSize}: de <strong>{parseSizes(adjustModal)[adjustSelectedSize] ?? 0}</strong> pasará a{' '}
                            <strong style={{ color: parseInt(adjustQty, 10) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                              {Math.max(0, (Number(parseSizes(adjustModal)[adjustSelectedSize]) || 0) + parseInt(adjustQty, 10))} pares
                            </strong>
                          </div>
                          <div style={{ marginTop: 4, color: 'var(--text-secondary)' }}>
                            Stock total del calzado: <strong>{Math.max(0, adjustModal.stock + parseInt(adjustQty, 10))} pares</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                        Ingresa cuántos pares sumar (+) o restar (-) en cada número:
                      </p>
                      <div className="shoe-sizes-matrix-grid" style={{ marginBottom: 12 }}>
                        {SHOE_SIZES.map(sz => {
                          const curStock = Number(parseSizes(adjustModal)[sz]) || 0;
                          const delta = multiAdjustSizes[sz] !== undefined ? multiAdjustSizes[sz] : '';
                          const intDelta = parseInt(delta, 10) || 0;
                          const finalSz = Math.max(0, curStock + intDelta);
                          return (
                            <div key={sz} className="shoe-size-cell" style={{ padding: 6, background: 'var(--bg-tertiary)', borderRadius: 6 }}>
                              <span className="size-label"># {sz}</span>
                              <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Act: {curStock}</small>
                              <input
                                type="number"
                                placeholder="+/-"
                                value={delta}
                                onChange={e => {
                                  const val = e.target.value;
                                  setMultiAdjustSizes(prev => ({ ...prev, [sz]: val }));
                                }}
                                style={{ padding: '4px', fontSize: '0.85rem', textAlign: 'center' }}
                              />
                              {delta !== '' && intDelta !== 0 && (
                                <small style={{ color: intDelta > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                                  → {finalSz}
                                </small>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* PRODUCTO GENERAL / JOYA */
                <div>
                  <div className="form-group">
                    <label>Cantidad a sumar o restar</label>
                    <input
                      type="number"
                      value={adjustQty}
                      onChange={e => setAdjustQty(e.target.value)}
                      placeholder="Ej: +10 (compra) o -2 (merma)"
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {[1, 5, 10, 20].map(n => (
                        <button
                          key={`+${n}`}
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                          onClick={() => setAdjustQty(String(n))}
                        >
                          +{n} pzas
                        </button>
                      ))}
                      {[-1, -2, -5].map(n => (
                        <button
                          key={`${n}`}
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '2px 8px', fontSize: '0.75rem', color: 'var(--danger)' }}
                          onClick={() => setAdjustQty(String(n))}
                        >
                          {n} pzas
                        </button>
                      ))}
                    </div>
                  </div>

                  {adjustQty && !isNaN(parseInt(adjustQty, 10)) && (
                    <div style={{
                      padding: 10,
                      borderRadius: 8,
                      background: 'var(--bg-tertiary)',
                      marginBottom: 12,
                      color: parseInt(adjustQty, 10) >= 0 ? 'var(--success)' : 'var(--danger)',
                      fontSize: '0.9rem'
                    }}>
                      Stock final resultará en: <strong>{Math.max(0, adjustModal.stock + parseInt(adjustQty, 10))} unidades</strong>
                    </div>
                  )}
                </div>
              )}

              {/* MOTIVO DEL MOVIMIENTO */}
              <div className="form-group">
                <label>Motivo del movimiento</label>
                <select value={adjustReason} onChange={e => setAdjustReason(e.target.value)}>
                  <option value="Recepción de mercancía / Proveedor">Recepción de mercancía / Proveedor</option>
                  <option value="Conteo físico / Auditoría de inventario">Conteo físico / Auditoría de inventario</option>
                  <option value="Merma o producto dañado">Merma / Defecto de fábrica</option>
                  <option value="Devolución de cliente">Devolución de cliente</option>
                  <option value="Uso en muestra / Exhibición">Muestra de exhibición</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setAdjustModal(null)}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleAdjust}
                disabled={
                  adjustMode === 'single'
                    ? (!adjustQty || isNaN(parseInt(adjustQty, 10)) || parseInt(adjustQty, 10) === 0)
                    : Object.values(multiAdjustSizes).every(v => !v || isNaN(parseInt(v, 10)) || parseInt(v, 10) === 0)
                }
              >
                Confirmar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
