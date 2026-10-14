import { useState } from 'react';
import {
  Search, Plus, Minus, X, ShoppingCart, Trash2,
  CreditCard, Banknote, ArrowRightLeft, CheckCircle, User,
  Phone, Printer, Sparkles, Tag, Layers, AlertTriangle,
  Calculator, RotateCcw, FileText, ArrowRight, ArrowLeft,
  Lock, Unlock, Delete
} from 'lucide-react';
import { useApp, getWholesaleTier, SHOE_SIZES_EUR, SHOE_SIZES_US } from '../context/AppContext';
import { formatCurrency } from '../utils/format';
import ReceiptModal from './ReceiptModal';
import CashRegisterModal from './CashRegisterModal';

export default function NewSale({ onNavigate }) {
  const {
    products, addSale, getNextSaleNumber, categories,
    isShoeCategory, getCategoryInfo, getCashBalance,
    addCashMovement, currentUser
  } = useApp();
  const cashInfo = getCashBalance();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [subcatFilter, setSubcatFilter] = useState('all');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState('');
  const [applyWholesale, setApplyWholesale] = useState(true);
  const [customWholesalePct, setCustomWholesalePct] = useState(null); // null = automático por piezas, o 5 | 10 | 15
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [completedSale, setCompletedSale] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showNumpad, setShowNumpad] = useState(true);

  // Estados de control de apertura de caja
  const [showCashRegisterModal, setShowCashRegisterModal] = useState(false);
  const [showMustOpenCashModal, setShowMustOpenCashModal] = useState(false);
  const [quickOpeningAmount, setQuickOpeningAmount] = useState('1000');
  const [quickOpeningNotes, setQuickOpeningNotes] = useState('');

  // Vista de pantalla completa para procesar venta y cobro en la sección de ventas
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Modal para seleccionar talla de zapato antes de meter al carrito
  const [sizePickerProduct, setSizePickerProduct] = useState(null);

  // Helper para mostrar prefijo correcto EUR vs US
  const formatSizeLabel = (sz) => {
    if (!sz) return '';
    const isEur = SHOE_SIZES_EUR.includes(String(sz)) || Number(sz) >= 30;
    return isEur ? `EUR #${sz}` : `US #${sz}`;
  };

  const availableProducts = products.filter(p => {
    if (p.status !== 'active') return false;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.color && p.color.toLowerCase().includes(q)) ||
      (p.material && p.material.toLowerCase().includes(q)) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(q));

    const matchCat = catFilter === 'all' || p.category === catFilter;
    const matchSubcat =
      catFilter === 'all' ||
      subcatFilter === 'all' ||
      (p.subcategory && p.subcategory.toLowerCase() === subcatFilter.toLowerCase());

    return matchSearch && matchCat && matchSubcat;
  });

  const handleProductClick = (product) => {
    if (Number(product.stock) <= 0) return;
    // Si es calzado y tiene matriz de tallas, abrir selector de talla
    if (isShoeCategory(product) && product.sizesStock && Object.keys(product.sizesStock).length > 0) {
      setSizePickerProduct(product);
    } else {
      addToCart(product, '');
    }
  };

  const addToCart = (product, selectedSize = '') => {
    const itemKey = `${product.id}_${selectedSize}`;
    const maxStockForThis = selectedSize && product.sizesStock
      ? Number(product.sizesStock[selectedSize]) || 0
      : Number(product.stock) || 0;

    if (maxStockForThis <= 0) return;

    setCart(prev => {
      const existing = prev.find(i => i.cartKey === itemKey);
      if (existing) {
        if (existing.quantity >= maxStockForThis) return prev;
        const newQty = existing.quantity + 1;
        return prev.map(i =>
          i.cartKey === itemKey
            ? { ...i, quantity: newQty, subtotal: newQty * Number(i.price) }
            : i
        );
      }

      const unitPrice = Number(product.salePrice) || 0;
      return [
        ...prev,
        {
          cartKey: itemKey,
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          selectedSize: selectedSize || '',
          color: product.color || '',
          costPrice: Number(product.costPrice) || 0,
          price: unitPrice,
          quantity: 1,
          subtotal: unitPrice,
          maxStock: maxStockForThis,
        },
      ];
    });

    setSizePickerProduct(null);
  };

  const updateQty = (cartKey, delta) => {
    setCart(prev =>
      prev.map(i => {
        if (i.cartKey !== cartKey) return i;
        const newQty = Math.max(1, Math.min(i.maxStock, i.quantity + delta));
        return { ...i, quantity: newQty, subtotal: newQty * Number(i.price) };
      })
    );
  };

  const removeFromCart = (cartKey) => {
    setCart(prev => prev.filter(i => i.cartKey !== cartKey));
  };

  // Cálculo estrictamente numérico del subtotal
  const subtotal = cart.reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0);

  // Cálculo de Descuento de Mayoreo oficial (con casilla de activación y selección de cualquier escala):
  // De 3 a 4 piezas -> 5%
  // De 5 a 7 piezas -> 10%
  // De 8 a más piezas -> 15%
  const totalPiecesInCart = cart.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const wholesaleTier = getWholesaleTier(totalPiecesInCart);
  const wholesalePct = !applyWholesale
    ? 0
    : (customWholesalePct !== null ? customWholesalePct : wholesaleTier.percent);
  const wholesaleDiscountAmount = (subtotal * wholesalePct) / 100;

  const handleToggleTierCheck = (pct) => {
    if (applyWholesale && wholesalePct === pct) {
      setApplyWholesale(false);
      setCustomWholesalePct(null);
    } else {
      setApplyWholesale(true);
      setCustomWholesalePct(pct);
    }
  };

  const handleToggleMasterWholesale = (checked) => {
    setApplyWholesale(checked);
    if (!checked) {
      setCustomWholesalePct(null);
    } else if (wholesaleTier.percent === 0 && customWholesalePct === null) {
      setCustomWholesalePct(5);
    }
  };

  const manualDiscountAmount = Math.max(0, Number(discount) || 0);
  const totalDiscount = wholesaleDiscountAmount + manualDiscountAmount;
  const total = Math.max(0, subtotal - totalDiscount);
  const receivedNum = Number(cashReceived) || 0;

  // Validaciones de cobro en Efectivo
  const isCashEmpty = paymentMethod === 'Efectivo' && (!cashReceived || receivedNum <= 0);
  const isCashShort = paymentMethod === 'Efectivo' && receivedNum > 0 && receivedNum < total;
  const cashShortage = isCashShort ? total - receivedNum : 0;
  const changeDue = paymentMethod === 'Efectivo' && receivedNum >= total ? receivedNum - total : 0;
  const isCashValid = paymentMethod !== 'Efectivo' || (receivedNum >= total && !isCashEmpty);

  // Manejador del Teclado Numérico Táctil
  const handleNumpadPress = (val) => {
    if (val === 'CLEAR') {
      setCashReceived('');
      return;
    }
    if (val === 'BACKSPACE') {
      setCashReceived(prev => {
        const s = String(prev || '');
        return s.slice(0, -1);
      });
      return;
    }
    if (val === 'EXACT') {
      setCashReceived(String(total));
      return;
    }
    if (val === '.') {
      setCashReceived(prev => {
        const s = String(prev || '');
        if (s.includes('.')) return s;
        return s ? `${s}.` : '0.';
      });
      return;
    }
    setCashReceived(prev => {
      const s = String(prev || '');
      if (s === '0') return val;
      return `${s}${val}`;
    });
  };

  const handleQuickBill = (amount) => {
    setCashReceived(String(amount));
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    const freshCash = getCashBalance();
    if (!freshCash.isRegisterOpen) {
      setShowMustOpenCashModal(true);
      return;
    }
    setIsCheckingOut(true);
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    const freshCash = getCashBalance();
    if (!freshCash.isRegisterOpen) {
      setShowMustOpenCashModal(true);
      return;
    }

    if (paymentMethod === 'Efectivo') {
      if (isCashEmpty) {
        alert('Monto requerido: Debes ingresar el monto de efectivo entregado por el cliente (o presionar el botón "Pago Exacto") antes de procesar el cobro.');
        return;
      }
      if (isCashShort) {
        alert(`Monto insuficiente: El cliente entregó ${formatCurrency(receivedNum)}, pero el total es ${formatCurrency(total)}. Faltan ${formatCurrency(cashShortage)} para completar el cobro.`);
        return;
      }
    }

    const saleNumber = getNextSaleNumber();
    const saleData = {
      saleNumber,
      date: new Date().toISOString(),
      items: cart.map(({ productId, productCode, productName, selectedSize, color, costPrice, quantity, price, subtotal }) => ({
        productId,
        productCode,
        productName,
        selectedSize: selectedSize || '',
        color: color || '',
        costPrice: Number(costPrice) || 0,
        quantity: Number(quantity) || 1,
        price: Number(price) || 0,
        subtotal: Number(subtotal) || 0,
      })),
      subtotal: Number(subtotal) || 0,
      wholesalePct,
      wholesaleDiscount: wholesaleDiscountAmount,
      discount: totalDiscount,
      total: Number(total) || 0,
      paymentMethod,
      paymentReference: paymentReference.trim() || null,
      receivedAmount: paymentMethod === 'Efectivo' && receivedNum >= total ? receivedNum : null,
      customerName: customerName.trim() || 'Cliente General',
      customerPhone: customerPhone.trim() || null,
      status: 'completed',
    };

    addSale(saleData);
    setIsCheckingOut(false);
    setCompletedSale(saleData);
    setCart([]);
    setDiscount('');
    setApplyWholesale(true);
    setCustomWholesalePct(null);
    setCustomerName('');
    setCustomerPhone('');
    setCashReceived('');
    setPaymentReference('');
  };

  if (completedSale) {
    return (
      <div className="page">
        <div className="success-screen">
          <div className="success-icon"><CheckCircle size={64} /></div>
          <h2>¡Venta Cobrada Exitosamente!</h2>
          <p>
            Folio: <strong>{completedSale.saleNumber}</strong> · Cliente: <strong>{completedSale.customerName}</strong>
          </p>
          <p style={{ fontSize: '1.6rem', color: 'var(--accent-light)', fontWeight: 800 }}>
            Total Cobrado: {formatCurrency(completedSale.total)}
          </p>
          {completedSale.receivedAmount && completedSale.receivedAmount > completedSale.total && (
            <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: '1.05rem' }}>
              Cambio a Entregar: {formatCurrency(completedSale.receivedAmount - completedSale.total)} (Recibido: {formatCurrency(completedSale.receivedAmount)})
            </p>
          )}

          <div className="success-actions">
            <button className="btn btn-primary btn-lg" onClick={() => setShowReceiptModal(true)}>
              <Printer size={18} /> Ver / Imprimir Ticket C$
            </button>
            <button className="btn btn-ghost" onClick={() => setCompletedSale(null)}>
              Nueva Venta
            </button>
            <button className="btn btn-ghost" onClick={() => onNavigate('sales')}>
              Ver Historial de Ventas
            </button>
          </div>
        </div>

        {showReceiptModal && (
          <ReceiptModal sale={completedSale} onClose={() => setShowReceiptModal(false)} />
        )}
      </div>
    );
  }

  const renderMustOpenCashModal = () => {
    if (!showMustOpenCashModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowMustOpenCashModal(false)}>
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171' }}>
              <Lock size={22} color="var(--danger)" /> Apertura de Caja Requerida
            </h2>
            <button className="icon-btn" onClick={() => setShowMustOpenCashModal(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="modal-body">
            <div style={{
              padding: 14,
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: 16,
              fontSize: '0.9rem',
              lineHeight: 1.5,
            }}>
              {cashInfo.autoClosedAt7pm ? (
                <p style={{ margin: 0 }}>
                  <strong>Cierre automático después de las 7:00 PM:</strong> Por regla de horario de la boutique, la caja se cerró automáticamente a las 19:00 hrs. Si necesitas realizar una venta extraordinaria, es obligatorio abrir un turno de caja nocturno.
                </p>
              ) : cashInfo.shiftStatus === 'closed' ? (
                <p style={{ margin: 0 }}>
                  <strong>Caja de hoy cerrada:</strong> El turno anterior fue cerrado con arqueo. Para registrar y cobrar nuevas ventas debes iniciar un nuevo turno de caja.
                </p>
              ) : (
                <p style={{ margin: 0 }}>
                  <strong>Caja sin apertura:</strong> No es posible facturar o cobrar ventas sin antes haber registrado la apertura de caja e ingresado el fondo de sencillo en el cajón.
                </p>
              )}
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const amt = Number(quickOpeningAmount) || 0;
              const shiftLabel = `Turno #${(cashInfo.shiftNumber || 1) + (cashInfo.shiftStatus === 'closed' ? 1 : 0)}`;
              const desc = quickOpeningNotes.trim()
                ? `Apertura de Caja (${shiftLabel}) — ${quickOpeningNotes.trim()}`
                : `Apertura de Caja (${shiftLabel}) — Fondo inicial de sencillo`;
              await addCashMovement({
                type: 'apertura',
                category: 'Apertura de Caja',
                description: desc,
                amount: amt,
                responsible: currentUser?.name || currentUser?.username || 'Administración',
              });
              setShowMustOpenCashModal(false);
              setQuickOpeningNotes('');
            }}>
              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                  Fondo Inicial en Cajón (C$) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={quickOpeningAmount}
                  onChange={e => setQuickOpeningAmount(e.target.value)}
                  placeholder="Ej: 1000.00"
                  autoFocus
                  required
                  style={{ fontSize: '1.1rem', fontWeight: 700 }}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {[0, 500, 1000, 1500, 2000, 3000].map(val => (
                    <button
                      key={val}
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                      onClick={() => setQuickOpeningAmount(String(val))}
                    >
                      C${val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 12 }}>
                <label style={{ fontSize: '0.82rem' }}>Nota u Observación (Opcional):</label>
                <input
                  value={quickOpeningNotes}
                  onChange={e => setQuickOpeningNotes(e.target.value)}
                  placeholder="Ej: Billetes de cambio C$20, C$50, C$100..."
                />
              </div>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowMustOpenCashModal(false);
                    setShowCashRegisterModal(true);
                  }}
                >
                  Ver Arqueo Completo
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'var(--success)', color: '#0f172a', fontWeight: 800, padding: '10px 20px' }}
                >
                  <Unlock size={17} /> Confirmar &amp; Abrir Caja
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  /* ========================================================================= */
  /* VISTA EN PANTALLA COMPLETA DE DETALLES DE LA VENTA & COBRO (SECCIÓN VENTA)*/
  /* ========================================================================= */
  if (isCheckingOut) {
    return (
      <div className="page pos-page pos-checkout-page">
        {/* Barra superior de navegación y título */}
        <div className="pos-checkout-topbar">
          <button
            type="button"
            className="btn btn-secondary btn-back-pos"
            onClick={() => setIsCheckingOut(false)}
          >
            <ArrowLeft size={18} /> Volver a Seleccionar Productos
          </button>
          <div className="pos-checkout-title-wrap">
            <h2>Detalles de la Venta &amp; Cobro</h2>
            <p>Revisa los artículos seleccionados y completa la transacción de caja</p>
          </div>
          <div className="pos-checkout-pill-badge">
            <ShoppingCart size={16} /> {totalPiecesInCart} {totalPiecesInCart === 1 ? 'artículo' : 'artículos'}
          </div>
        </div>

        {/* ALERTA EN CASO DE CAJA CERRADA EN COBRO */}
        {!cashInfo.isRegisterOpen && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.18)',
            border: '1px solid rgba(239, 68, 68, 0.45)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 18px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Lock size={18} color="var(--danger)" />
              <span style={{ fontSize: '0.88rem', color: '#f87171', fontWeight: 700 }}>
                La caja se encuentra CERRADA {cashInfo.autoClosedAt7pm ? '(Cierre automático 7:00 PM)' : ''}. Debes abrir caja para confirmar y procesar este cobro.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ background: 'var(--success)', color: '#0f172a', fontWeight: 800, padding: '6px 14px' }}
              onClick={() => setShowMustOpenCashModal(true)}
            >
              <Unlock size={15} /> Abrir Caja Ahora
            </button>
          </div>
        )}

        {/* Layout a dos columnas en pantalla completa */}
        <div className="pos-checkout-layout">
          {/* COLUMNA 1: RESUMEN DETALLADO DE PRODUCTOS Y TOTALES */}
          <div className="pos-checkout-items-col">
            <div className="pos-checkout-panel">
              <div className="pos-checkout-panel-header">
                <ShoppingCart size={18} color="var(--accent)" />
                <h3>Productos Seleccionados ({totalPiecesInCart} pzas)</h3>
              </div>

              <div className="pos-checkout-table-wrapper">
                <table className="pos-checkout-table">
                  <thead>
                    <tr>
                      <th>Artículo</th>
                      <th>Talla</th>
                      <th>Color</th>
                      <th>Precio</th>
                      <th style={{ textAlign: 'center' }}>Cant.</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(it => (
                      <tr key={it.cartKey}>
                        <td>
                          <div className="table-item-name">{it.productName}</div>
                          <div className="table-item-code">{it.productCode}</div>
                        </td>
                        <td>
                          {it.selectedSize ? (
                            <span className={`badge badge-sm ${SHOE_SIZES_EUR.includes(String(it.selectedSize)) || Number(it.selectedSize) >= 30 ? 'badge-primary' : 'badge-accent'}`}>
                              {formatSizeLabel(it.selectedSize)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>
                        <td>
                          {it.color ? (
                            <span className="badge badge-sm badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                              Color: {it.color}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>
                        <td>{formatCurrency(it.price)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="pos-checkout-qty-group">
                            <button
                              type="button"
                              className="qty-btn-sm"
                              onClick={() => updateQty(it.cartKey, -1)}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="qty-val-sm">{it.quantity}</span>
                            <button
                              type="button"
                              className="qty-btn-sm"
                              onClick={() => updateQty(it.cartKey, 1)}
                              disabled={it.quantity >= it.maxStock}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>
                          {formatCurrency(it.subtotal)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="icon-btn danger small"
                            onClick={() => {
                              removeFromCart(it.cartKey);
                              if (cart.length <= 1) {
                                setIsCheckingOut(false);
                              }
                            }}
                            title="Quitar de la venta"
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MAYOREO Y DESCUENTOS EN PANTALLA COMPLETA */}
              <div className="pos-checkout-discounts-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={applyWholesale && wholesalePct > 0}
                      onChange={e => handleToggleMasterWholesale(e.target.checked)}
                      style={{ width: 15, height: 15, accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    <span>Aplicar Descuento en Escala de Mayoreo</span>
                  </label>
                  {customWholesalePct !== null && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '1px 6px', fontSize: '0.68rem', height: 20 }}
                      onClick={() => { setCustomWholesalePct(null); setApplyWholesale(true); }}
                    >
                      Auto ({wholesaleTier.percent}%)
                    </button>
                  )}
                </div>

                <div className="wholesale-tiers-row" style={{ marginBottom: 6 }}>
                  {[
                    { pct: 5, label: '3-4 pzas: 5%' },
                    { pct: 10, label: '5-7 pzas: 10%' },
                    { pct: 15, label: '8+ pzas: 15%' },
                  ].map(t => {
                    const isChecked = applyWholesale && wholesalePct === t.pct;
                    return (
                      <label
                        key={t.pct}
                        className={`tier-badge ${isChecked ? 'active' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', userSelect: 'none', margin: 0 }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleTierCheck(t.pct)}
                          style={{ width: 13, height: 13, accentColor: 'var(--accent)', cursor: 'pointer', margin: 0 }}
                        />
                        <span>{t.label}</span>
                      </label>
                    );
                  })}
                </div>

                {wholesalePct > 0 ? (
                  <div className="wholesale-applied-checkout">
                    <Sparkles size={16} color="var(--accent)" />
                    <div>
                      <strong>¡Descuento de Mayoreo ({wholesalePct}%) activo! (-{formatCurrency(wholesaleDiscountAmount)})</strong>
                    </div>
                  </div>
                ) : (
                  <div className="wholesale-tip-checkout">
                    <Tag size={14} color="var(--accent)" />
                    <span>
                      {!applyWholesale
                        ? 'Descuento de mayoreo desactivado para esta venta.'
                        : `Marca una casilla arriba o agrega ${wholesaleTier.nextTierPieces} art. más para 5% automático.`}
                    </span>
                  </div>
                )}

                <div className="checkout-manual-discount-row">
                  <label>Descuento Especial / Manual (C$):</label>
                  <input
                    type="number"
                    className="discount-input"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    placeholder="0.00"
                    style={{ width: 110, textAlign: 'right' }}
                  />
                </div>
              </div>

              {/* TARJETA DE TOTALES FINANCIEROS */}
              <div className="pos-checkout-totals-card">
                <div className="checkout-tot-row">
                  <span>Subtotal Artículos:</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
                {wholesaleDiscountAmount > 0 && (
                  <div className="checkout-tot-row discount">
                    <span>Descuento Mayoreo ({wholesalePct}%):</span>
                    <strong>-{formatCurrency(wholesaleDiscountAmount)}</strong>
                  </div>
                )}
                {manualDiscountAmount > 0 && (
                  <div className="checkout-tot-row discount">
                    <span>Descuento Manual:</span>
                    <strong>-{formatCurrency(manualDiscountAmount)}</strong>
                  </div>
                )}
                <div className="checkout-tot-divider" />
                <div className="checkout-tot-row grand-total">
                  <span>TOTAL A COBRAR:</span>
                  <span className="checkout-grand-total-val">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA 2: FORMULARIO DE CLIENTE Y COBRO */}
          <div className="pos-checkout-payment-col">
            <div className="pos-checkout-panel">
              <div className="pos-checkout-panel-header">
                <CreditCard size={18} color="var(--accent)" />
                <h3>Datos del Cliente &amp; Métodos de Pago</h3>
              </div>

              {/* Cliente y Teléfono */}
              <div className="checkout-customer-section">
                <div className="form-row" style={{ gap: 10, marginBottom: 0 }}>
                  <div className="form-group" style={{ flex: 1.6, marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label style={{ fontSize: '0.8rem', marginBottom: 0 }}><User size={13} /> Nombre del Cliente</label>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: '0 6px', fontSize: '0.7rem', height: 18 }}
                        onClick={() => setCustomerName('Público General')}
                      >
                        Público General
                      </button>
                    </div>
                    <input
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Público General o Nombre..."
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1.1, marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem', marginBottom: 4 }}><Phone size={13} /> Teléfono (Máx. 8 dígitos)</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={8}
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="Ej: 88888888"
                    />
                  </div>
                </div>
              </div>

              {/* Selector de Método de Pago */}
              <div className="checkout-payment-methods-section">
                <label className="section-label" style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                  Seleccionar Método de Pago:
                </label>
                <div className="payment-method-buttons-grid">
                  {[
                    { v: 'Efectivo', Icon: Banknote, l: 'Efectivo (C$)' },
                    { v: 'Tarjeta', Icon: CreditCard, l: 'Tarjeta POS' },
                    { v: 'Transferencia', Icon: ArrowRightLeft, l: 'Transferencia' },
                  ].map(({ v, Icon, l }) => (
                    <button
                      key={v}
                      type="button"
                      className={`pay-method-btn ${paymentMethod === v ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(v)}
                    >
                      <Icon size={18} />
                      <span>{l}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenido según método de pago */}
              {paymentMethod === 'Efectivo' ? (
                <div className="checkout-cash-module">
                  {/* Monto Recibido y Visualizador de Vuelto */}
                  <div className="form-row" style={{ gap: 10, alignItems: 'flex-start' }}>
                    <div className="form-group" style={{ flex: 1.2, marginBottom: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <label style={{ marginBottom: 0, fontSize: '0.82rem', fontWeight: 700 }}>
                          Efectivo Recibido (C$) *
                        </label>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '1px 6px', fontSize: '0.7rem', height: 20 }}
                          onClick={() => setShowNumpad(v => !v)}
                        >
                          <Calculator size={11} /> {showNumpad ? 'Ocultar Numpad' : 'Ver Numpad'}
                        </button>
                      </div>
                      <div className="cash-input-wrap large">
                        <span className="cash-currency-prefix">C$</span>
                        <input
                          type="number"
                          className={`cash-input large ${isCashShort ? 'short' : isCashValid && cashReceived ? 'valid' : ''}`}
                          value={cashReceived}
                          onChange={e => setCashReceived(e.target.value)}
                          placeholder="0.00"
                          step="any"
                          autoFocus
                        />
                        {cashReceived && (
                          <button
                            type="button"
                            className="cash-clear-btn"
                            onClick={() => handleNumpadPress('CLEAR')}
                            title="Limpiar monto"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label style={{ marginBottom: 4, fontSize: '0.82rem', fontWeight: 700 }}>
                        {isCashShort ? 'Faltante de Pago' : 'Cambio / Vuelto'}
                      </label>
                      <div
                        className={`change-display-badge large ${
                          isCashShort ? 'short' : changeDue > 0 ? 'positive' : isCashEmpty ? 'empty' : 'exact'
                        }`}
                      >
                        {isCashShort ? (
                          <span>- {formatCurrency(cashShortage)}</span>
                        ) : changeDue > 0 ? (
                          <span>+ {formatCurrency(changeDue)}</span>
                        ) : isCashEmpty ? (
                          <span style={{ fontSize: '0.78rem', opacity: 0.7 }}>Esperando monto</span>
                        ) : (
                          <span>Pago Exacto</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Billetes rápidos de Nicaragua */}
                  <div className="pos-quick-bills" style={{ marginTop: 6 }}>
                    <button
                      type="button"
                      className={`quick-bill-btn exact ${receivedNum === total && !isCashEmpty ? 'active' : ''}`}
                      onClick={() => handleNumpadPress('EXACT')}
                    >
                      Exacto ({formatCurrency(total)})
                    </button>
                    {[100, 200, 500, 1000].map(bill => (
                      <button
                        key={bill}
                        type="button"
                        className={`quick-bill-btn ${receivedNum === bill ? 'active' : ''}`}
                        onClick={() => handleQuickBill(bill)}
                      >
                        C${bill}
                      </button>
                    ))}
                  </div>

                  {/* Teclado numérico táctil */}
                  {showNumpad && (
                    <div className="pos-touch-numpad" style={{ marginTop: 10 }}>
                      <div className="numpad-row">
                        {['7', '8', '9'].map(k => (
                          <button key={k} type="button" className="numpad-btn" onClick={() => handleNumpadPress(k)}>
                            {k}
                          </button>
                        ))}
                      </div>
                      <div className="numpad-row">
                        {['4', '5', '6'].map(k => (
                          <button key={k} type="button" className="numpad-btn" onClick={() => handleNumpadPress(k)}>
                            {k}
                          </button>
                        ))}
                      </div>
                      <div className="numpad-row">
                        {['1', '2', '3'].map(k => (
                          <button key={k} type="button" className="numpad-btn" onClick={() => handleNumpadPress(k)}>
                            {k}
                          </button>
                        ))}
                      </div>
                      <div className="numpad-row">
                        <button type="button" className="numpad-btn clear" onClick={() => handleNumpadPress('CLEAR')}>
                          C
                        </button>
                        <button type="button" className="numpad-btn" onClick={() => handleNumpadPress('0')}>
                          0
                        </button>
                        <button type="button" className="numpad-btn backspace" onClick={() => handleNumpadPress('BACKSPACE')} title="Borrar">
                          <Delete size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Tarjeta o Transferencia */
                <div style={{ marginTop: 8, marginBottom: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                      <FileText size={15} color="var(--accent)" />
                      {paymentMethod === 'Tarjeta' ? 'No. de Voucher / Lote / Terminal POS (Opcional)' : 'Referencia de Transferencia (BAC / LAFISE)'}
                    </label>
                    <input
                      value={paymentReference}
                      onChange={e => setPaymentReference(e.target.value)}
                      placeholder={paymentMethod === 'Tarjeta' ? 'Ej: Voucher #4521' : 'Ej: Ref. BAC #987654'}
                      autoFocus
                      style={{ fontSize: '1rem', padding: '12px 14px' }}
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: 4, display: 'block' }}>
                      Este número quedará impreso en el ticket para conciliación de caja.
                    </small>
                  </div>
                </div>
              )}

              {/* ACCIONES FINALES DE COBRO */}
              <div className="pos-checkout-actions-row">
                <button
                  type="button"
                  className="btn btn-ghost btn-lg"
                  onClick={() => setIsCheckingOut(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px' }}
                >
                  <ArrowLeft size={18} /> Volver a Productos
                </button>

                <button
                  type="button"
                  className={`btn btn-primary btn-lg btn-confirm-checkout ${isCashShort ? 'btn-danger' : ''}`}
                  onClick={handleCompleteSale}
                  disabled={!isCashValid}
                >
                  {isCashShort ? (
                    <>
                      <AlertTriangle size={18} /> Faltan {formatCurrency(cashShortage)}
                    </>
                  ) : isCashEmpty && paymentMethod === 'Efectivo' ? (
                    <>
                      <Banknote size={18} /> Ingresa Efectivo
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} /> Confirmar Venta &amp; Emitir Ticket ({formatCurrency(total)})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Apertura Obligatoria en Checkout */}
        {renderMustOpenCashModal()}
        {showCashRegisterModal && (
          <CashRegisterModal onClose={() => setShowCashRegisterModal(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="page pos-page">
      <div className="page-header pos-header">
        <div>
          <h1>Nueva Venta (POS)</h1>
          <p>Terminal de Cobro Rápido — Moneda oficial: Córdobas (C$)</p>
        </div>
      </div>

      {/* ALERTA DE CAJA CERRADA / CIERRE AUTOMÁTICO 7 PM */}
      {!cashInfo.isRegisterOpen && (
        <div className="pos-cash-warning-banner" style={{
          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 18px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.2)',
              borderRadius: '50%',
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--danger)',
              flexShrink: 0,
            }}>
              <Lock size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#f87171' }}>
                Caja Cerrada — Es obligatorio abrir caja para procesar ventas
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {cashInfo.autoClosedAt7pm
                  ? 'El turno de caja se cerró automáticamente después de las 7:00 PM por horario de boutique. Puedes iniciar un turno extraordinario.'
                  : cashInfo.shiftStatus === 'closed'
                  ? 'Caja cerrada por arqueo de turno. Inicia un nuevo turno para poder cobrar.'
                  : 'Aún no se ha registrado la apertura de caja de hoy. Registra el fondo de sencillo inicial.'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ background: 'var(--success)', color: '#0f172a', fontWeight: 800, padding: '8px 16px' }}
              onClick={() => setShowMustOpenCashModal(true)}
            >
              <Unlock size={16} /> Abrir Caja Ahora
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '0.8rem', padding: '8px 12px' }}
              onClick={() => setShowCashRegisterModal(true)}
            >
              Ver Arqueo
            </button>
          </div>
        </div>
      )}

      <div className="pos-layout">
        {/* Catálogo de Productos a la Izquierda */}
        <div className="pos-products">
          <div className="pos-search" style={{ gap: 10, marginBottom: 16 }}>
            {/* Barra de búsqueda ARRIBA */}
            <div className="search-input" style={{ width: '100%', maxWidth: '100%' }}>
              <Search size={18} />
              <input
                placeholder="Buscar por nombre, código, color, material..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="icon-btn small"
                  onClick={() => setSearch('')}
                  title="Limpiar búsqueda"
                  style={{ padding: 2, background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filtros ABAJO de la barra de búsqueda (Como en el inventario) */}
            <div className="filters-bar" style={{ display: 'flex', gap: 10, margin: 0, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={catFilter}
                onChange={e => {
                  setCatFilter(e.target.value);
                  setSubcatFilter('all');
                }}
                style={{ flex: 1, minWidth: 160 }}
              >
                <option value="all">Todas las categorías</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={subcatFilter}
                onChange={e => setSubcatFilter(e.target.value)}
                disabled={catFilter === 'all'}
                style={{
                  flex: 1,
                  minWidth: 180,
                  ...(catFilter === 'all' ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                }}
                title={catFilter === 'all' ? 'Selecciona una categoría primero para filtrar subcategorías' : 'Filtrar por subcategoría'}
              >
                <option value="all">
                  {catFilter === 'all'
                    ? 'Todas las subcategorías (requiere categoría)'
                    : 'Todas las subcategorías'}
                </option>
                {catFilter !== 'all' &&
                  (categories.find(c => c.id === catFilter)?.subcategories || []).map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
              </select>

              {(catFilter !== 'all' || subcatFilter !== 'all' || search) && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setCatFilter('all');
                    setSubcatFilter('all');
                    setSearch('');
                  }}
                  title="Limpiar filtros y búsqueda"
                  style={{ fontSize: '0.78rem', padding: '6px 12px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <RotateCcw size={13} /> Limpiar
                </button>
              )}
            </div>
          </div>

          <div className="pos-product-grid">
            {availableProducts.length === 0 ? (
              <p className="empty-msg">No se encontraron productos disponibles con existencias</p>
            ) : (
              availableProducts.map(p => {
                const totalInCartForProd = cart
                  .filter(i => i.productId === p.id)
                  .reduce((acc, it) => acc + it.quantity, 0);

                const isOut = Number(p.stock) <= 0;
                const catInfo = getCategoryInfo(p);

                return (
                  <div
                    key={p.id}
                    className={`pos-product-card ${totalInCartForProd > 0 ? 'in-cart' : ''} ${isOut ? 'out-of-stock' : ''}`}
                    onClick={() => handleProductClick(p)}
                  >
                    <div className="pos-prod-top">
                      <code>{p.code}</code>
                      <span className={`badge badge-sm ${catInfo.isShoe ? 'badge-info' : 'badge-purple'}`}>
                        {catInfo.name}
                      </span>
                    </div>

                    <h4>{p.name}</h4>
                    <p className="pos-prod-sub">
                      <span>{p.subcategory} {p.size ? `· ${p.size}` : ''}</span>
                      {p.color && (
                        <span className="pos-prod-color-pill">
                          Color: {p.color}
                        </span>
                      )}
                    </p>

                    <div className="pos-prod-bottom">
                      <span className="price">{formatCurrency(p.salePrice)}</span>
                      <span className={`stock ${isOut ? 'out' : 'has-stock'}`}>
                        {isOut ? (
                          <>Agotado</>
                        ) : (
                          <>Stock: <strong>{p.stock}</strong> pzas</>
                        )}
                      </span>
                    </div>

                    {totalInCartForProd > 0 && (
                      <div className="pos-prod-in-cart-badge">
                        {totalInCartForProd} en carrito
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel Carrito a la Derecha (SÓLO PRODUCTOS SELECCIONADOS Y BOTÓN PROCESAR VENTA) */}
        <div className="pos-cart">
          {/* 1. Encabezado del Carrito */}
          <div className="cart-header">
            <h3>
              <ShoppingCart size={20} /> Carrito ({totalPiecesInCart} piezas)
            </h3>
            {cart.length > 0 && (
              <button
                className="btn btn-ghost"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                onClick={() => setCart([])}
              >
                Vaciar
              </button>
            )}
          </div>

          {/* 2. Lista de Productos Seleccionados */}
          <div className="cart-scroll-area">
            <div className="cart-items-wrapper">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <ShoppingCart size={46} color="var(--text-muted)" />
                  <p style={{ marginTop: 12, fontSize: '0.95rem', fontWeight: 600 }}>El carrito está vacío</p>
                  <small style={{ color: 'var(--text-muted)' }}>
                    Haz clic en los productos del catálogo para agregarlos a la venta.
                  </small>
                </div>
              ) : (
                <div className="cart-items-list">
                  {cart.map(item => (
                    <div key={item.cartKey} className="cart-item-row">
                      <div className="cart-item-main">
                        <div className="cart-item-title">
                          <strong>{item.productName}</strong>
                          {item.selectedSize && (
                            <span className="badge badge-sm badge-info" style={{ marginLeft: 6 }}>
                              Talla {formatSizeLabel(item.selectedSize)}
                            </span>
                          )}
                          {item.color && (
                            <span className="badge badge-sm badge-secondary" style={{ marginLeft: 6, fontWeight: 700 }}>
                              Color: {item.color}
                            </span>
                          )}
                        </div>
                        <small className="cart-item-sub">
                          {item.productCode} · {formatCurrency(item.price)} c/u
                          {item.color && (
                            <span style={{ color: 'var(--text-secondary)', marginLeft: 4 }}>
                              · Color: <strong>{item.color}</strong>
                            </span>
                          )}
                        </small>
                      </div>

                      <div className="cart-item-controls">
                        <button className="qty-btn" onClick={() => updateQty(item.cartKey, -1)}>
                          <Minus size={13} />
                        </button>
                        <span className="qty-number">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQty(item.cartKey, 1)}
                          disabled={item.quantity >= item.maxStock}
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <div className="cart-item-end">
                        <span className="cart-item-subtotal-val">{formatCurrency(item.subtotal)}</span>
                        <button
                          className="icon-btn danger small"
                          title="Quitar"
                          onClick={() => removeFromCart(item.cartKey)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECCIÓN DE MAYOREO DENTRO DEL CARRITO */}
            {cart.length > 0 && (
              <div style={{ padding: '0 12px 12px 12px' }}>
                <div className="pos-wholesale-section" style={{ marginTop: 8 }}>
                  <div className="wholesale-badge-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: 0 }} className="wholesale-title">
                        <input
                          type="checkbox"
                          checked={applyWholesale && wholesalePct > 0}
                          onChange={e => handleToggleMasterWholesale(e.target.checked)}
                          style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }}
                        />
                        <span>Aplicar Mayoreo:</span>
                      </label>
                      {customWholesalePct !== null && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '1px 6px', fontSize: '0.68rem', height: 18 }}
                          onClick={() => { setCustomWholesalePct(null); setApplyWholesale(true); }}
                        >
                          Auto ({wholesaleTier.percent}%)
                        </button>
                      )}
                    </div>

                    <div className="wholesale-tiers-row">
                      {[
                        { pct: 5, range: '3-4' },
                        { pct: 10, range: '5-7' },
                        { pct: 15, range: '8+' },
                      ].map(t => {
                        const isChecked = applyWholesale && wholesalePct === t.pct;
                        return (
                          <label
                            key={t.pct}
                            className={`tier-badge ${isChecked ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', userSelect: 'none', margin: 0 }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleTierCheck(t.pct)}
                              style={{ width: 12, height: 12, accentColor: 'var(--accent)', cursor: 'pointer', margin: 0 }}
                            />
                            <span>{t.range}: <strong>{t.pct}%</strong></span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {wholesalePct > 0 ? (
                    <div className="wholesale-applied-alert">
                      <Sparkles size={14} color="var(--accent)" />
                      <span>
                        <strong>¡Mayoreo {wholesalePct}% aplicado!</strong> Ahorro de -{formatCurrency(wholesaleDiscountAmount)}
                      </span>
                    </div>
                  ) : (
                    <div className="wholesale-upsell-tip">
                      {!applyWholesale
                        ? 'Descuento de mayoreo desactivado (marca una casilla para aplicarlo).'
                        : `Marca una casilla o agrega ${wholesaleTier.nextTierPieces} art. más para 5% automático.`}
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginTop: 8, marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ marginBottom: 0, fontSize: '0.8rem' }}>Descuento Manual Extra (C$)</label>
                    <input
                      type="number"
                      className="discount-input"
                      value={discount}
                      onChange={e => setDiscount(e.target.value)}
                      placeholder="0.00"
                      style={{ width: 90, textAlign: 'right' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. BARRA INFERIOR CON TOTAL Y BOTÓN "PROCESAR VENTA" */}
          <div className="cart-sticky-bottom">
            <div className="cart-summary-line">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="cart-subtotal-text">
                  Subtotal ({totalPiecesInCart} arts): {formatCurrency(subtotal)}
                </span>
                {wholesaleDiscountAmount > 0 && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600 }}>
                    Mayoreo (-{wholesalePct}%): -{formatCurrency(wholesaleDiscountAmount)}
                  </span>
                )}
                {manualDiscountAmount > 0 && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Desc. Manual: -{formatCurrency(manualDiscountAmount)}
                  </span>
                )}
              </div>
              <div className="cart-total-badge">
                <span className="cart-total-label">TOTAL:</span>
                <span className="cart-total-value">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* BOTÓN PROCESAR VENTA (ABRE EL FORMULARIO EN PANTALLA COMPLETA) */}
            <button
              className="btn btn-primary btn-lg btn-full btn-procesar-venta"
              onClick={handleProceedToCheckout}
              disabled={cart.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                fontSize: '1.08rem',
                fontWeight: 700,
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {cart.length === 0 ? (
                <>
                  <ShoppingCart size={20} /> Carrito Vacío
                </>
              ) : (
                <>
                  <span>Procesar Venta ({formatCurrency(total)})</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>


      {/* MODAL SELECTOR DE TALLA PARA CALZADO (CON SEPARACIÓN CLARA EUR Y US) */}
      {sizePickerProduct && (
        <div className="modal-overlay" onClick={() => setSizePickerProduct(null)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Layers size={18} color="var(--accent)" /> Seleccionar Talla: {sizePickerProduct.name}
              </h2>
              <button className="icon-btn" onClick={() => setSizePickerProduct(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                Elige la talla disponible que deseas agregar al carrito:
              </p>

              {/* TALLAS EUROPEAS (EUR) */}
              <div style={{ marginBottom: 14 }}>
                <span className="badge badge-primary" style={{ fontSize: '0.72rem', marginBottom: 8, display: 'inline-block' }}>
                  Tallas Europeas (EUR 35 al 42)
                </span>
                <div className="size-selector-grid">
                  {SHOE_SIZES_EUR.map(sz => {
                    const stockCount = Number((sizePickerProduct.sizesStock || {})[sz]) || 0;
                    const available = stockCount > 0;
                    return (
                      <button
                        key={`picker-eur-${sz}`}
                        className={`size-pick-card ${available ? 'available' : 'unavailable'}`}
                        disabled={!available}
                        onClick={() => addToCart(sizePickerProduct, sz)}
                      >
                        <span className="size-tag-num">EUR #{sz}</span>
                        <span className="size-tag-stock">
                          {available ? (
                            <><strong>{stockCount}</strong> en stock</>
                          ) : (
                            'Agotada'
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TALLAS AMERICANAS (US) */}
              <div>
                <span className="badge badge-accent" style={{ fontSize: '0.72rem', marginBottom: 8, display: 'inline-block' }}>
                  Tallas Americanas (US 4 al 11)
                </span>
                <div className="size-selector-grid">
                  {SHOE_SIZES_US.map(sz => {
                    const stockCount = Number((sizePickerProduct.sizesStock || {})[sz]) || 0;
                    const available = stockCount > 0;
                    return (
                      <button
                        key={`picker-us-${sz}`}
                        className={`size-pick-card ${available ? 'available' : 'unavailable'}`}
                        disabled={!available}
                        onClick={() => addToCart(sizePickerProduct, sz)}
                      >
                        <span className="size-tag-num">US #{sz}</span>
                        <span className="size-tag-stock">
                          {available ? (
                            <><strong>{stockCount}</strong> en stock</>
                          ) : (
                            'Agotada'
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setSizePickerProduct(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Apertura Obligatoria de Caja */}
      {renderMustOpenCashModal()}

      {/* Modal Completo de Arqueo y Control de Caja */}
      {showCashRegisterModal && (
        <CashRegisterModal onClose={() => setShowCashRegisterModal(false)} />
      )}
    </div>
  );
}
