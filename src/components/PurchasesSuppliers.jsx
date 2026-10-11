import { useState } from 'react';
import {
  Truck, Package, Plus, Search, Trash2, Edit, CheckCircle,
  FileText, Banknote, ArrowRightLeft, CreditCard, Layers,
  Phone, Mail, MapPin, Building, Printer, X, AlertTriangle,
  ChevronDown, ExternalLink, MessageCircle, DollarSign, Calendar
} from 'lucide-react';
import { useApp, SHOE_SIZES_EUR, SHOE_SIZES_US } from '../context/AppContext';
import { formatCurrency, formatDateTime } from '../utils/format';

export default function PurchasesSuppliers({ onNavigate }) {
  const {
    products,
    suppliers,
    purchases,
    addPurchase,
    cancelPurchase,
    getNextPurchaseNumber,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    getNextSupplierCode,
  } = useApp();

  const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' | 'suppliers'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modales
  const [showNewPurchaseModal, setShowNewPurchaseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [viewingPurchase, setViewingPurchase] = useState(null);

  // --- ESTADO PARA NUEVA COMPRA ---
  const [purchaseSupplierId, setPurchaseSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Transferencia');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([]);

  // Selector de ítem para agregar a la compra
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUnitCost, setItemUnitCost] = useState('');
  const [itemSizesBreakdown, setItemSizesBreakdown] = useState({});
  const [itemSizeSystem, setItemSizeSystem] = useState('eur'); // 'eur' | 'us'

  // --- ESTADO PARA NUEVO / EDITAR PROVEEDOR ---
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    ruc: '',
    category: 'zapatos',
    address: '',
    notes: '',
  });
  const [supplierErrors, setSupplierErrors] = useState({});

  // Resetear formulario de compra
  const resetPurchaseForm = () => {
    setPurchaseSupplierId(suppliers[0]?.id ? String(suppliers[0].id) : '');
    setInvoiceNumber('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Transferencia');
    setPurchaseNotes('');
    setPurchaseItems([]);
    setSelectedProductId('');
    setProductSearchTerm('');
    setShowProductDropdown(false);
    setItemQuantity('1');
    setItemUnitCost('');
    setItemSizesBreakdown({});
  };

  const handleOpenNewPurchase = () => {
    resetPurchaseForm();
    setShowNewPurchaseModal(true);
  };

  const handleSelectProduct = (prod) => {
    setSelectedProductId(String(prod.id));
    setItemUnitCost(String(prod.costPrice || 0));
    setItemSizesBreakdown({});
    setItemQuantity('1');
    setProductSearchTerm('');
    setShowProductDropdown(false);
  };

  const handleProductSelectChange = (pId) => {
    setSelectedProductId(pId);
    const prod = products.find(p => String(p.id) === String(pId));
    if (prod) {
      setItemUnitCost(String(prod.costPrice || 0));
      setItemSizesBreakdown({});
      setItemQuantity('1');
    }
  };

  const handleSizeQtyChange = (size, qtyStr) => {
    const qty = Math.max(0, parseInt(qtyStr, 10) || 0);
    const updated = { ...itemSizesBreakdown, [size]: qty };
    if (qty === 0) delete updated[size];
    setItemSizesBreakdown(updated);

    // Sumar el total de tallas a la cantidad
    const totalQty = Object.values(updated).reduce((acc, n) => acc + (Number(n) || 0), 0);
    setItemQuantity(String(totalQty || 1));
  };

  const handleAddItemToPurchase = () => {
    const prod = products.find(p => String(p.id) === String(selectedProductId));
    if (!prod) {
      alert('Por favor selecciona un producto usando el buscador');
      return;
    }

    const cost = Number(itemUnitCost);
    if (isNaN(cost) || cost <= 0) {
      alert('Ingresa un costo unitario válido en C$');
      return;
    }

    const isShoe = prod.category === 'zapatos';
    const hasSizes = isShoe && Object.keys(itemSizesBreakdown).length > 0;
    const qty = hasSizes
      ? Object.values(itemSizesBreakdown).reduce((acc, n) => acc + (Number(n) || 0), 0)
      : Math.max(1, parseInt(itemQuantity, 10) || 1);

    if (qty <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    const newItem = {
      productId: prod.id,
      productCode: prod.code,
      productName: prod.name,
      category: prod.category,
      quantity: qty,
      unitCost: cost,
      subtotal: qty * cost,
      sizesBreakdown: hasSizes ? { ...itemSizesBreakdown } : null,
    };

    setPurchaseItems(prev => [...prev, newItem]);
    // Limpiar para buscar el siguiente producto con facilidad
    setSelectedProductId('');
    setProductSearchTerm('');
    setShowProductDropdown(false);
    setItemSizesBreakdown({});
    setItemQuantity('1');
    setItemUnitCost('');
  };

  const handleRemovePurchaseItem = (index) => {
    setPurchaseItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSavePurchase = () => {
    if (!purchaseSupplierId) {
      alert('Selecciona un proveedor');
      return;
    }
    if (purchaseItems.length === 0) {
      alert('Agrega al menos un producto a la compra');
      return;
    }

    const supplier = suppliers.find(s => String(s.id) === String(purchaseSupplierId));
    const totalAmount = purchaseItems.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
    const purchaseNum = getNextPurchaseNumber();

    const purchaseData = {
      purchaseNumber: purchaseNum,
      invoiceNumber: invoiceNumber.trim() || 'S/N',
      supplierId: supplier ? supplier.id : null,
      supplierName: supplier ? supplier.name : 'Proveedor General',
      date: purchaseDate ? `${purchaseDate}T${new Date().toTimeString().split(' ')[0]}` : new Date().toISOString(),
      paymentMethod,
      items: purchaseItems,
      total: totalAmount,
      status: 'received',
      notes: purchaseNotes.trim(),
    };

    addPurchase(purchaseData);
    setShowNewPurchaseModal(false);
    alert(`✅ Compra ${purchaseNum} registrada exitosamente. Se ha actualizado el inventario y Kardex.`);
  };

  const handleCancelPurchase = (purchase) => {
    if (purchase.status === 'cancelled') return;
    if (window.confirm(`¿Estás seguro de anular la compra ${purchase.purchaseNumber}? Esta acción restará la mercancía ingresada del inventario.`)) {
      cancelPurchase(purchase.id);
      alert(`Compra ${purchase.purchaseNumber} anulada y stock revertido.`);
    }
  };

  // --- LOGICA DE PROVEEDORES ---
  const handleOpenSupplierModal = (sup = null) => {
    if (sup) {
      setEditingSupplier(sup);
      setSupplierForm({ ...sup });
    } else {
      setEditingSupplier(null);
      setSupplierForm({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        ruc: '',
        category: 'zapatos',
        address: '',
        notes: '',
      });
    }
    setSupplierErrors({});
    setShowSupplierModal(true);
  };

  const handleSaveSupplier = (e) => {
    e.preventDefault();
    const errors = {};
    if (!supplierForm.name.trim()) errors.name = 'El nombre de la empresa es obligatorio';
    if (!supplierForm.phone.trim()) errors.phone = 'El teléfono es obligatorio';

    if (Object.keys(errors).length > 0) {
      setSupplierErrors(errors);
      return;
    }

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, supplierForm);
    } else {
      const code = getNextSupplierCode();
      addSupplier({
        ...supplierForm,
        code,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
      });
    }
    setShowSupplierModal(false);
  };

  const handleDeleteSupplier = (sup) => {
    const supPurchases = purchases.filter(p => p.supplierId === sup.id);
    if (supPurchases.length > 0) {
      if (!window.confirm(`Este proveedor tiene ${supPurchases.length} compras registradas. ¿Eliminarlo de todos modos?`)) {
        return;
      }
    } else {
      if (!window.confirm(`¿Eliminar al proveedor "${sup.name}"?`)) return;
    }
    deleteSupplier(sup.id);
  };

  // Filtros de Compras
  const filteredPurchases = purchases.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      p.purchaseNumber.toLowerCase().includes(q) ||
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(q)) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(q)) ||
      (p.items || []).some(it => it.productName.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Filtros de Proveedores
  const filteredSuppliers = suppliers.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.ruc && s.ruc.toLowerCase().includes(q)) ||
      (s.code && s.code.toLowerCase().includes(q))
    );
  });

  // Métricas de Compras
  const totalSpent = purchases
    .filter(p => p.status === 'received')
    .reduce((acc, p) => acc + (Number(p.total) || 0), 0);

  const totalItemsReceived = purchases
    .filter(p => p.status === 'received')
    .reduce((acc, p) => acc + (p.items || []).reduce((a, it) => a + (Number(it.quantity) || 0), 0), 0);

  const selectedProduct = products.find(p => String(p.id) === String(selectedProductId));

  // Filtro para el buscador predictivo de productos en compras
  const filteredProductsForPurchase = products.filter(p => {
    if (!productSearchTerm.trim()) return true;
    const term = productSearchTerm.toLowerCase().trim();
    return (
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.code && p.code.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term)) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(term)) ||
      (p.color && p.color.toLowerCase().includes(term)) ||
      (p.material && p.material.toLowerCase().includes(term))
    );
  });

  return (
    <div className="purchases-page">
      {/* HEADER DE LA SECCIÓN */}
      <div className="page-header">
        <div>
          <h2>Compras &amp; Proveedores</h2>
          <p className="page-subtitle">
            Control de compras de mercancía, entradas a inventario y directorio de proveedores mayoristas.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => handleOpenSupplierModal()}>
            <Plus size={16} /> Nuevo Proveedor
          </button>
          <button className="btn btn-primary" onClick={handleOpenNewPurchase}>
            <Truck size={16} /> Registrar Compra
          </button>
        </div>
      </div>

      {/* METRICAS KPI */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent)' }}>
            <DollarSign size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{formatCurrency(totalSpent)}</span>
            <span className="kpi-label">Inversión Total en Compras</span>
            <span className="kpi-sub">Entradas registradas</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <Package size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{totalItemsReceived} unid.</span>
            <span className="kpi-label">Piezas / Pares Ingresados</span>
            <span className="kpi-sub">Total stock surtido</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
            <Building size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{suppliers.length} activos</span>
            <span className="kpi-label">Proveedores Registrados</span>
            <span className="kpi-sub">Directorio comercial</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
            <FileText size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{purchases.length} órdenes</span>
            <span className="kpi-label">Facturas de Compra</span>
            <span className="kpi-sub">Historial de entradas</span>
          </div>
        </div>
      </div>

      {/* PESTAÑAS */}
      <div className="purchases-tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchases')}
        >
          <Package size={18} /> Compras de Mercancía ({purchases.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          <Building size={18} /> Directorio de Proveedores ({suppliers.length})
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="filters-bar" style={{ marginTop: 16 }}>
        <div className="search-input" style={{ flex: 1, minWidth: '260px' }}>
          <Search size={18} />
          <input
            placeholder={
              activeTab === 'purchases'
                ? 'Buscar por folio, factura, proveedor o producto...'
                : 'Buscar proveedor por nombre, teléfono, RUC...'
            }
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {activeTab === 'purchases' && (
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ minWidth: '180px' }}
          >
            <option value="all">Todos los estados</option>
            <option value="received">Recibida (En inventario)</option>
            <option value="cancelled">Anulada</option>
          </select>
        )}
      </div>

      {/* CONTENIDO PESTAÑA 1: COMPRAS DE MERCANCÍA */}
      {activeTab === 'purchases' && (
        <div className="table-container" style={{ marginTop: 16 }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Folio</th>
                  <th style={{ width: '160px' }}>Fecha</th>
                  <th>Proveedor &amp; Factura</th>
                  <th>Artículos Recibidos</th>
                  <th style={{ textAlign: 'right', width: '140px' }}>Total Compra</th>
                  <th style={{ textAlign: 'center', width: '130px' }}>Método Pago</th>
                  <th style={{ textAlign: 'center', width: '110px' }}>Estado</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-cell">
                      No se encontraron compras registradas.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map(p => (
                    <tr key={p.id}>
                      <td>
                        <span className="code-pill">{p.purchaseNumber}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {formatDateTime(p.date)}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {p.supplierName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Factura Ref: <strong style={{ color: 'var(--text-secondary)' }}>{p.invoiceNumber}</strong>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {(p.items || []).map((it, idx) => (
                            <span key={idx} style={{ fontSize: '0.82rem' }}>
                              <strong style={{ color: 'var(--accent-light)' }}>{it.quantity}x</strong>{' '}
                              <span>{it.productName}</span>
                              {it.sizesBreakdown && (
                                <small style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>
                                  ({Object.entries(it.sizesBreakdown).map(([sz, q]) => `T${sz}:${q}`).join(', ')})
                                </small>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '1rem', color: 'var(--accent)' }}>
                          {formatCurrency(p.total)}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="payment-pill">{p.paymentMethod}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {p.status === 'received' ? (
                          <span className="badge badge-success">Recibida</span>
                        ) : (
                          <span className="badge badge-danger">Anulada</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                          <button
                            className="icon-btn"
                            title="Ver Comprobante de Compra"
                            onClick={() => setViewingPurchase(p)}
                          >
                            <FileText size={16} />
                          </button>
                          {p.status === 'received' && (
                            <button
                              className="icon-btn"
                              title="Anular compra (revertir stock)"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => handleCancelPurchase(p)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 2: DIRECTORIO DE PROVEEDORES */}
      {activeTab === 'suppliers' && (
        <div className="suppliers-grid" style={{ marginTop: 16 }}>
          {filteredSuppliers.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No se encontraron proveedores.</p>
            </div>
          ) : (
            filteredSuppliers.map(s => {
              const purchasesCount = purchases.filter(p => p.supplierId === s.id).length;
              const totalPurchasedFromThis = purchases
                .filter(p => p.supplierId === s.id && p.status === 'received')
                .reduce((acc, p) => acc + (Number(p.total) || 0), 0);

              return (
                <div key={s.id} className="supplier-card">
                  <div className="supplier-card-header">
                    <div>
                      <span className="code-pill">{s.code}</span>
                      <h3 style={{ marginTop: 4 }}>{s.name}</h3>
                      {s.contactPerson && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Contacto: <strong>{s.contactPerson}</strong>
                        </p>
                      )}
                    </div>
                    <div className="supplier-actions">
                      <button className="icon-btn" onClick={() => handleOpenSupplierModal(s)} title="Editar Proveedor">
                        <Edit size={16} />
                      </button>
                      <button className="icon-btn" onClick={() => handleDeleteSupplier(s)} title="Eliminar Proveedor" style={{ color: 'var(--danger)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="supplier-card-body">
                    {s.phone && (
                      <div className="supplier-info-line">
                        <Phone size={14} color="var(--accent)" />
                        <span>Tel: <strong>{s.phone}</strong></span>
                        <a
                          href={`https://wa.me/505${s.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="whatsapp-btn-sm"
                          title="Contactar por WhatsApp"
                        >
                          <MessageCircle size={12} /> WhatsApp
                        </a>
                      </div>
                    )}
                    {s.ruc && (
                      <div className="supplier-info-line">
                        <FileText size={14} color="var(--text-muted)" />
                        <span>RUC: <strong>{s.ruc}</strong></span>
                      </div>
                    )}
                    {s.email && (
                      <div className="supplier-info-line">
                        <Mail size={14} color="var(--text-muted)" />
                        <span>{s.email}</span>
                      </div>
                    )}
                    {s.address && (
                      <div className="supplier-info-line">
                        <MapPin size={14} color="var(--text-muted)" />
                        <span>{s.address}</span>
                      </div>
                    )}
                    {s.notes && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
                        "{s.notes}"
                      </p>
                    )}
                  </div>

                  <div className="supplier-card-footer">
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Compras Realizadas</span>
                      <strong style={{ display: 'block', fontSize: '0.95rem' }}>{purchasesCount} órdenes</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Facturado</span>
                      <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--accent)' }}>
                        {formatCurrency(totalPurchasedFromThis)}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL 1: REGISTRAR NUEVA COMPRA DE MERCANCÍA */}
      {showNewPurchaseModal && (
        <div className="modal-overlay" onClick={() => setShowNewPurchaseModal(false)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Truck size={22} color="var(--accent)" />
                <h2>Registrar Compra de Mercancía (Entrada de Stock)</h2>
              </div>
              <button className="icon-btn" onClick={() => setShowNewPurchaseModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="info-banner" style={{ marginBottom: 16 }}>
                <p>
                  📦 Folio automático: <strong>{getNextPurchaseNumber()}</strong> · Al registrar esta compra, las cantidades se <strong>sumarán automáticamente al inventario</strong>, se actualizará el precio de costo del producto y se registrará la entrada en el Kardex.
                </p>
              </div>

              {/* DATOS GENERALES DE LA COMPRA */}
              <div className="form-row">
                <div className="form-group flex-2">
                  <label>Proveedor *</label>
                  <select
                    value={purchaseSupplierId}
                    onChange={e => setPurchaseSupplierId(e.target.value)}
                  >
                    <option value="">Selecciona un proveedor...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.ruc ? `(RUC: ${s.ruc})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>No. Factura Proveedor *</label>
                  <input
                    placeholder="Ej: FAC-9821 o Remisión 102"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Fecha de Compra</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={e => setPurchaseDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Método de Pago</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    <option value="Efectivo">Efectivo de Caja (Registra Egreso)</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Crédito">Crédito a Proveedor</option>
                  </select>
                </div>
              </div>

              {/* SECCIÓN DE AGREGAR PRODUCTOS A LA COMPRA */}
              <div className="purchase-items-builder-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', margin: 0 }}>
                    <Package size={18} /> Agregar Artículos a la Factura
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Paso 2: Busca el producto y asigna costo y cantidades
                  </span>
                </div>

                {/* BUSCADOR PREDICTIVO CON SUGERENCIAS */}
                <div className="form-group" style={{ position: 'relative', marginBottom: 14 }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Buscar Producto a Recibir *</span>
                    {selectedProduct && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        (Escribe para buscar o cambiar de producto)
                      </span>
                    )}
                  </label>
                  <div className="search-input" style={{ width: '100%' }}>
                    <Search size={18} />
                    <input
                      type="text"
                      placeholder="🔍 Escribe nombre o código (ej: Sandalia Maya, DS-ZAP-001, Tacón, Aretes...)"
                      value={productSearchTerm}
                      onChange={e => {
                        setProductSearchTerm(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                    />
                    {productSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setProductSearchTerm('')}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Backdrop para cerrar el dropdown al hacer click afuera */}
                  {showProductDropdown && (
                    <div
                      className="dropdown-backdrop"
                      onClick={() => setShowProductDropdown(false)}
                    />
                  )}

                  {/* LISTA DESPLEGABLE FLOTANTE */}
                  {showProductDropdown && (
                    <div className="purchase-product-dropdown-menu">
                      <div className="dropdown-header-tip">
                        {productSearchTerm
                          ? `Resultados para "${productSearchTerm}" (${filteredProductsForPurchase.length})`
                          : `Catálogo de productos disponibles (${products.length})`}
                      </div>
                      <div className="dropdown-items-scroll">
                        {filteredProductsForPurchase.length === 0 ? (
                          <div className="dropdown-empty-state">
                            No se encontraron productos con "{productSearchTerm}".
                          </div>
                        ) : (
                          filteredProductsForPurchase.slice(0, 15).map(prod => {
                            const isSelected = String(prod.id) === String(selectedProductId);
                            return (
                              <div
                                key={prod.id}
                                className={`purchase-product-dropdown-item ${isSelected ? 'active' : ''}`}
                                onClick={() => handleSelectProduct(prod)}
                              >
                                <div className="prod-item-left">
                                  <span className="code-pill">{prod.code}</span>
                                  <div className="prod-item-info">
                                    <strong className="prod-item-name">{prod.name}</strong>
                                    <span className="prod-item-sub">
                                      {prod.category === 'zapatos' ? '👠 Calzado' : '💎 Joyas'}
                                      {prod.subcategory ? ` · ${prod.subcategory}` : ''}
                                      {prod.color ? ` · ${prod.color}` : ''}
                                    </span>
                                  </div>
                                </div>
                                <div className="prod-item-right">
                                  <span className="prod-item-stock">
                                    Stock: <strong>{prod.stock}</strong>
                                  </span>
                                  <span className="prod-item-cost">
                                    Costo ref: <strong>{formatCurrency(prod.costPrice)}</strong>
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* SI NO HAY PRODUCTO SELECCIONADO */}
                {!selectedProduct && (
                  <div className="no-product-selected-alert">
                    <Package size={20} color="var(--accent)" />
                    <span>Usa el buscador de arriba para seleccionar el artículo que vas a ingresar al almacén.</span>
                  </div>
                )}

                {/* PRODUCTO SELECCIONADO: DETALLES, COSTO Y TALLAS */}
                {selectedProduct && (
                  <div>
                    <div className="selected-product-banner">
                      <div className="sel-prod-details">
                        <span className="code-pill">{selectedProduct.code}</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                            {selectedProduct.name}
                          </h4>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                            {selectedProduct.category === 'zapatos' ? '👠 Calzado / Tacones' : '💎 Joyería'}
                            {selectedProduct.subcategory ? ` · ${selectedProduct.subcategory}` : ''}
                            {selectedProduct.color ? ` · Color: ${selectedProduct.color}` : ''}
                            {' · '}
                            <span style={{ color: selectedProduct.stock > 0 ? 'var(--success)' : 'var(--danger)' }}>
                              Stock actual: {selectedProduct.stock} unidades
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Costo anterior</span>
                          <strong style={{ color: 'var(--accent-light)', fontSize: '0.95rem' }}>
                            {formatCurrency(selectedProduct.costPrice)}
                          </strong>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                          onClick={() => setShowProductDropdown(true)}
                        >
                          <Search size={14} /> Cambiar
                        </button>
                      </div>
                    </div>

                    <div className="form-row" style={{ marginTop: 14 }}>
                      <div className="form-group flex-1">
                        <label>Costo Unitario de Compra (C$) *</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={itemUnitCost}
                          onChange={e => setItemUnitCost(e.target.value)}
                          placeholder="Precio al que compraste"
                        />
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>
                          Este precio actualizará el costo unitario del producto en catálogo.
                        </small>
                      </div>

                      {selectedProduct?.category !== 'zapatos' && (
                        <div className="form-group flex-1">
                          <label>Cantidad a Recibir (unidades) *</label>
                          <input
                            type="number"
                            min="1"
                            value={itemQuantity}
                            onChange={e => setItemQuantity(e.target.value)}
                            placeholder="Ej: 10"
                          />
                        </div>
                      )}
                    </div>

                    {/* SI EL PRODUCTO ES CALZADO / TACONES: DESGLOSE DE TALLAS */}
                    {selectedProduct?.category === 'zapatos' && (
                      <div className="purchase-sizes-matrix-box" style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            👠 Cantidad a recibir por cada talla:
                          </span>
                          <div className="size-system-selector">
                            <button
                              type="button"
                              className={`size-sys-btn ${itemSizeSystem === 'eur' ? 'active' : ''}`}
                              onClick={() => setItemSizeSystem('eur')}
                            >
                              Tacones EUR (35-42)
                            </button>
                            <button
                              type="button"
                              className={`size-sys-btn ${itemSizeSystem === 'us' ? 'active' : ''}`}
                              onClick={() => setItemSizeSystem('us')}
                            >
                              US (4-11)
                            </button>
                          </div>
                          <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700 }}>
                            Total pares: {itemQuantity}
                          </span>
                        </div>

                        <div className="shoe-sizes-matrix-grid">
                          {(itemSizeSystem === 'eur' ? SHOE_SIZES_EUR : SHOE_SIZES_US).map(sz => (
                            <div key={sz} className="shoe-size-cell">
                              <span className="size-label">{itemSizeSystem === 'eur' ? `EUR ${sz}` : `US ${sz}`}</span>
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={itemSizesBreakdown[sz] || ''}
                                onChange={e => handleSizeQtyChange(sz, e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                      <button type="button" className="btn btn-secondary" onClick={handleAddItemToPurchase}>
                        <Plus size={16} /> Añadir a la Lista
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* LISTA DE PRODUCTOS AGREGADOS A LA COMPRA */}
              <div style={{ marginTop: 20 }}>
                <h4 style={{ marginBottom: 8 }}>Artículos en esta Compra ({purchaseItems.length})</h4>
                <div className="table-container">
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th style={{ width: '130px' }}>CÓDIGO</th>
                          <th>DESCRIPCIÓN</th>
                          <th style={{ textAlign: 'center', width: '100px' }}>CANTIDAD</th>
                          <th style={{ textAlign: 'right', width: '140px' }}>COSTO UNIT. (C$)</th>
                          <th style={{ textAlign: 'right', width: '140px' }}>SUBTOTAL (C$)</th>
                          <th style={{ textAlign: 'center', width: '80px' }}>ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseItems.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="empty-cell">
                              No has añadido ningún producto todavía. Usa el buscador superior para agregar.
                            </td>
                          </tr>
                        ) : (
                          purchaseItems.map((it, idx) => (
                            <tr key={idx}>
                              <td><span className="code-pill">{it.productCode}</span></td>
                              <td>
                                <strong>{it.productName}</strong>
                                {it.sizesBreakdown && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: 2 }}>
                                    Tallas: {Object.entries(it.sizesBreakdown).map(([sz, q]) => `T${sz}: ${q}p`).join(', ')}
                                  </div>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}><strong>{it.quantity}</strong></td>
                              <td style={{ textAlign: 'right' }}>{formatCurrency(it.unitCost)}</td>
                              <td style={{ textAlign: 'right' }}>
                                <strong style={{ color: 'var(--accent)' }}>{formatCurrency(it.subtotal)}</strong>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="icon-btn"
                                  onClick={() => handleRemovePurchaseItem(idx)}
                                  style={{ color: 'var(--danger)' }}
                                  title="Quitar de la lista"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* RESUMEN Y NOTAS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 16, gap: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Notas de la compra / Observaciones:</label>
                  <textarea
                    rows={2}
                    value={purchaseNotes}
                    onChange={e => setPurchaseNotes(e.target.value)}
                    placeholder="Ej. Recibido por Don Juan, mercancía en caja sellada..."
                    style={{ width: '100%', marginTop: 4 }}
                  />
                </div>
                <div className="purchase-total-card">
                  <span>TOTAL A PAGAR:</span>
                  <div className="amount">
                    {formatCurrency(purchaseItems.reduce((acc, it) => acc + Number(it.subtotal || 0), 0))}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowNewPurchaseModal(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSavePurchase}
                disabled={purchaseItems.length === 0}
              >
                <CheckCircle size={16} /> Registrar Compra &amp; Ingresar al Inventario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NUEVO / EDITAR PROVEEDOR */}
      {showSupplierModal && (
        <div className="modal-overlay" onClick={() => setShowSupplierModal(false)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
              <button className="icon-btn" onClick={() => setShowSupplierModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre de la Empresa o Razón Social *</label>
                  <input
                    value={supplierForm.name}
                    onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    placeholder="Ej: Calzados León S.A. / Joyería San Jerónimo"
                  />
                  {supplierErrors.name && <span className="field-error">{supplierErrors.name}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Persona de Contacto</label>
                    <input
                      value={supplierForm.contactPerson}
                      onChange={e => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                      placeholder="Ej: Carlos Morales"
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono / WhatsApp *</label>
                    <input
                      value={supplierForm.phone}
                      onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                      placeholder="Ej: 8822 1100"
                    />
                    {supplierErrors.phone && <span className="field-error">{supplierErrors.phone}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>RUC del Proveedor</label>
                    <input
                      value={supplierForm.ruc}
                      onChange={e => setSupplierForm({ ...supplierForm, ruc: e.target.value })}
                      placeholder="Ej: J031000045892"
                    />
                  </div>
                  <div className="form-group">
                    <label>Categoría que provee</label>
                    <select
                      value={supplierForm.category}
                      onChange={e => setSupplierForm({ ...supplierForm, category: e.target.value })}
                    >
                      <option value="zapatos">👠 Calzado &amp; Tacones</option>
                      <option value="joyas">💎 Joyería &amp; Accesorios</option>
                      <option value="general">📦 General / Varios</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Correo Electrónico</label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    placeholder="ventas@proveedor.com"
                  />
                </div>

                <div className="form-group">
                  <label>Dirección / Ubicación</label>
                  <input
                    value={supplierForm.address}
                    onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })}
                    placeholder="Ej: Km 4.5 Carretera Norte, Managua"
                  />
                </div>

                <div className="form-group">
                  <label>Notas / Condiciones de Entrega</label>
                  <textarea
                    rows={2}
                    value={supplierForm.notes}
                    onChange={e => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                    placeholder="Descuentos por docena, tiempo de despacho..."
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowSupplierModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSupplier ? 'Guardar Cambios' : 'Registrar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VER COMPROBANTE / FACTURA DE COMPRA */}
      {viewingPurchase && (
        <div className="modal-overlay" onClick={() => setViewingPurchase(null)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header no-print">
              <h2><FileText size={18} /> Comprobante de Compra (C$)</h2>
              <button className="icon-btn" onClick={() => setViewingPurchase(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body receipt-printable">
              <div className="receipt-header">
                <div className="receipt-brand">DASSEL SANDALS</div>
                <div className="receipt-subtitle">Comprobante de Entrada de Mercancía</div>
                <p className="receipt-info">RUC: 8882903041001S · Tel: +505 8610 0645</p>
              </div>

              <div className="receipt-divider">================================</div>

              <div className="receipt-meta">
                <div><span>FOLIO COMPRA:</span> <strong>{viewingPurchase.purchaseNumber}</strong></div>
                <div><span>FACTURA PROV:</span> <strong>{viewingPurchase.invoiceNumber}</strong></div>
                <div><span>PROVEEDOR:</span> {viewingPurchase.supplierName}</div>
                <div><span>FECHA:</span> {formatDateTime(viewingPurchase.date)}</div>
                <div><span>MÉTODO PAGO:</span> {viewingPurchase.paymentMethod}</div>
                <div><span>ESTADO:</span> {viewingPurchase.status === 'received' ? 'INGRESADO' : 'ANULADO'}</div>
              </div>

              <div className="receipt-divider">--------------------------------</div>

              <table className="receipt-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>PRODUCTO</th>
                    <th style={{ textAlign: 'center' }}>CANT</th>
                    <th style={{ textAlign: 'right' }}>COSTO</th>
                    <th style={{ textAlign: 'right' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewingPurchase.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{it.productName}</strong>
                        {it.sizesBreakdown && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {Object.entries(it.sizesBreakdown).map(([sz, q]) => `T${sz}:${q}`).join(', ')}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(it.unitCost)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="receipt-divider">--------------------------------</div>

              <div className="receipt-totals">
                <div className="receipt-total-row grand-total">
                  <span>TOTAL COMPRA:</span>
                  <span>{formatCurrency(viewingPurchase.total)}</span>
                </div>
              </div>

              {viewingPurchase.notes && (
                <p style={{ fontSize: '0.75rem', marginTop: 10, color: '#64748b' }}>
                  Nota: {viewingPurchase.notes}
                </p>
              )}
            </div>

            <div className="modal-actions no-print">
              <button className="btn btn-ghost" onClick={() => setViewingPurchase(null)}>
                Cerrar
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Imprimir Comprobante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
