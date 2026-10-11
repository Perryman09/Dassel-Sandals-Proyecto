import { useState } from 'react';
import {
  Search, Plus, Minus, X, ShoppingCart, Trash2,
  CreditCard, Banknote, ArrowRightLeft, CheckCircle, User,
  Phone, Printer, Sparkles, Tag, Layers, AlertTriangle,
  Calculator, RotateCcw, FileText
} from 'lucide-react';
import { useApp, getWholesaleTier } from '../context/AppContext';
import { formatCurrency } from '../utils/format';
import ReceiptModal from './ReceiptModal';

export default function NewSale({ onNavigate }) {
  const { products, addSale, getNextSaleNumber } = useApp();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [completedSale, setCompletedSale] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showNumpad, setShowNumpad] = useState(true);

  // Modal para seleccionar talla de zapato antes de meter al carrito
  const [sizePickerProduct, setSizePickerProduct] = useState(null);

  const availableProducts = products.filter(p => {
    if (p.status !== 'active' || Number(p.stock) <= 0) return false;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.color && p.color.toLowerCase().includes(q)) ||
      (p.material && p.material.toLowerCase().includes(q));
    const matchCat = catFilter === 'all' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const handleProductClick = (product) => {
    // Si es calzado y tiene matriz de tallas, abrir selector de talla
    if (product.category === 'zapatos' && product.sizesStock && Object.keys(product.sizesStock).length > 0) {
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

  // Cálculo de Descuento de Mayoreo oficial (Calzado & Joyas):
  // De 3 a 4 piezas -> 5%
  // De 5 a 7 piezas -> 10%
  // De 8 a más piezas -> 15%
  const totalPiecesInCart = cart.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const wholesaleTier = getWholesaleTier(totalPiecesInCart);
  const wholesalePct = wholesaleTier.percent;
  const wholesaleDiscountAmount = (subtotal * wholesalePct) / 100;

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
        return s === '' ? '0.' : s + '.';
      });
      return;
    }
    // Agregar dígito numérico
    setCashReceived(prev => {
      const s = String(prev || '');
      if (s === '0' && val !== '.') return String(val);
      if (s.includes('.')) {
        const [_, dec] = s.split('.');
        if (dec && dec.length >= 2) return s;
      }
      return s + String(val);
    });
  };

  const handleQuickBill = (amount) => {
    setCashReceived(String(amount));
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'Efectivo') {
      if (isCashEmpty) {
        alert('⚠️ Monto requerido: Debes ingresar el monto de efectivo entregado por el cliente (o presionar el botón "Pago Exacto") antes de procesar el cobro.');
        return;
      }
      if (isCashShort) {
        alert(`⚠️ Monto insuficiente: El cliente entregó ${formatCurrency(receivedNum)}, pero el total es ${formatCurrency(total)}. Faltan ${formatCurrency(cashShortage)} para completar el cobro.`);
        return;
      }
    }

    const saleNumber = getNextSaleNumber();
    const saleData = {
      saleNumber,
      date: new Date().toISOString(),
      items: cart.map(({ productId, productCode, productName, selectedSize, costPrice, quantity, price, subtotal }) => ({
        productId,
        productCode,
        productName,
        selectedSize: selectedSize || '',
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
    setCompletedSale(saleData);
    setCart([]);
    setDiscount('');
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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Nueva Venta (POS)</h1>
          <p>Terminal de Cobro Rápido — Moneda oficial: Córdobas (C$)</p>
        </div>
      </div>

      <div className="pos-layout">
        {/* Catálogo de Productos a la Izquierda */}
        <div className="pos-products">
          <div className="pos-search">
            <div className="search-input">
              <Search size={18} />
              <input
                placeholder="Buscar calzado, joya, código, color..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="pos-cat-tabs">
              {[
                ['all', 'Todos los Artículos'],
                ['zapatos', '👡 Zapatos & Sandalias'],
                ['joyas', '💎 Joyas & Accesorios'],
              ].map(([v, l]) => (
                <button
                  key={v}
                  className={`cat-tab ${catFilter === v ? 'active' : ''}`}
                  onClick={() => setCatFilter(v)}
                >
                  {l}
                </button>
              ))}
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

                const isLow = Number(p.stock) <= Number(p.minStock);

                return (
                  <div
                    key={p.id}
                    className={`pos-product-card ${totalInCartForProd > 0 ? 'in-cart' : ''}`}
                    onClick={() => handleProductClick(p)}
                  >
                    <div className="pos-prod-top">
                      <code>{p.code}</code>
                      <span className={`badge badge-sm ${p.category === 'zapatos' ? 'badge-info' : 'badge-purple'}`}>
                        {p.category === 'zapatos' ? '👡 Calzado' : '💎 Joya'}
                      </span>
                    </div>

                    <strong>{p.name}</strong>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {p.subcategory} {p.size ? `· ${p.size}` : ''}
                    </div>

                    <span className="pos-prod-price">{formatCurrency(p.salePrice)}</span>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <small style={{ color: isLow ? 'var(--warning)' : 'var(--text-muted)' }}>
                        Stock: {p.stock} pzas
                      </small>
                      {totalInCartForProd > 0 && (
                        <span className="badge badge-sm badge-success">
                          {totalInCartForProd} en carrito
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel Carrito y Cobro a la Derecha */}
        <div className="pos-cart">
          {/* 1. Encabezado Fijo del Carrito */}
          <div className="cart-header">
            <h3>
              <ShoppingCart size={20} /> Carrito ({cart.reduce((acc, i) => acc + i.quantity, 0)} piezas)
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

          {/* 2. Zona Central con Scroll (Artículos + Datos de Pago) */}
          <div className="cart-scroll-area">
            {/* Lista de Artículos */}
            <div className="cart-items-wrapper">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <ShoppingCart size={40} color="var(--text-muted)" />
                  <p>Haz clic en los productos para agregarlos a la venta</p>
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
                              Talla US #{item.selectedSize}
                            </span>
                          )}
                        </div>
                        <small className="cart-item-sub">
                          {item.productCode} · {formatCurrency(item.price)} c/u
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

            {/* Formulario de Cliente, Método de Pago y Descuento */}
            <div className="cart-form-section">
              <div className="form-row" style={{ gap: 8, marginBottom: 8 }}>
                <div className="form-group" style={{ flex: 1.8, marginBottom: 0 }}>
                  <label><User size={13} /> Cliente</label>
                  <input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Público General"
                  />
                </div>
                <div className="form-group" style={{ flex: 1.2, marginBottom: 0 }}>
                  <label><Phone size={13} /> Teléfono</label>
                  <input
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 6, marginBottom: 8 }}>
                <label>Método de Pago</label>
                <div className="payment-methods">
                  {[
                    { v: 'Efectivo', Icon: Banknote, l: 'Efectivo' },
                    { v: 'Tarjeta', Icon: CreditCard, l: 'Tarjeta' },
                    { v: 'Transferencia', Icon: ArrowRightLeft, l: 'Transferencia' },
                  ].map(({ v, Icon, l }) => (
                    <button
                      key={v}
                      type="button"
                      className={`pay-btn ${paymentMethod === v ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(v)}
                    >
                      <Icon size={14} /> {l}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'Efectivo' ? (
                <div className="pos-cash-module">
                  {/* Fila con Input y Visualizador de Cambio */}
                  <div className="form-row" style={{ gap: 8, alignItems: 'flex-start' }}>
                    <div className="form-group" style={{ flex: 1.2, marginBottom: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <label style={{ marginBottom: 0 }}>Efectivo Recibido (C$) *</label>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '1px 6px', fontSize: '0.68rem', height: 20 }}
                          onClick={() => setShowNumpad(v => !v)}
                          title="Mostrar/Ocultar teclado táctil"
                        >
                          <Calculator size={11} /> {showNumpad ? 'Ocultar Numpad' : 'Ver Numpad'}
                        </button>
                      </div>
                      <div className="cash-input-wrap">
                        <input
                          type="number"
                          className={`cash-input ${isCashShort ? 'short' : isCashValid && cashReceived ? 'valid' : ''}`}
                          value={cashReceived}
                          onChange={e => setCashReceived(e.target.value)}
                          placeholder="0.00"
                          step="any"
                        />
                        {cashReceived && (
                          <button
                            type="button"
                            className="cash-clear-btn"
                            onClick={() => handleNumpadPress('CLEAR')}
                            title="Limpiar monto"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label style={{ marginBottom: 4 }}>
                        {isCashShort ? 'Faltante de Pago' : 'Cambio / Vuelto'}
                      </label>
                      <div
                        className={`change-display-badge ${
                          isCashShort ? 'short' : changeDue > 0 ? 'positive' : isCashEmpty ? 'empty' : 'exact'
                        }`}
                      >
                        {isCashShort ? (
                          <span>- {formatCurrency(cashShortage)}</span>
                        ) : changeDue > 0 ? (
                          <span>+ {formatCurrency(changeDue)}</span>
                        ) : isCashEmpty ? (
                          <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Esperando monto</span>
                        ) : (
                          <span>Pago Exacto</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ADVERTENCIA DE MONTO INSUFICIENTE */}
                  {isCashShort && (
                    <div className="cash-alert-banner shortage">
                      <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                      <span>
                        ⚠️ Monto insuficiente: Faltan <strong>{formatCurrency(cashShortage)}</strong> para completar el pago.
                      </span>
                    </div>
                  )}

                  {/* MENSAJE INFORMATIVO SI ESTÁ VACÍO */}
                  {isCashEmpty && cart.length > 0 && (
                    <div className="cash-alert-banner neutral">
                      <Banknote size={15} style={{ flexShrink: 0 }} />
                      <span>
                        💵 Digita el monto en el teclado o pulsa <strong>"Exacto"</strong> para cobrar.
                      </span>
                    </div>
                  )}

                  {/* BOTONES RÁPIDOS DE BILLETES DE NICARAGUA */}
                  <div className="pos-quick-bills">
                    <button
                      type="button"
                      className={`quick-bill-btn exact ${receivedNum === total && !isCashEmpty ? 'active' : ''}`}
                      onClick={() => handleNumpadPress('EXACT')}
                    >
                      💵 Exacto ({formatCurrency(total)})
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

                  {/* TECLADO NUMÉRICO TÁCTIL (NUMPAD POS) */}
                  {showNumpad && (
                    <div className="pos-touch-numpad">
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
                        <button type="button" className="numpad-btn backspace" onClick={() => handleNumpadPress('BACKSPACE')}>
                          ⌫
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* CAMPOS PARA TARJETA O TRANSFERENCIA */
                <div style={{ marginTop: 6, marginBottom: 8 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={13} />
                      {paymentMethod === 'Tarjeta' ? 'No. de Voucher / Lote (Opcional)' : 'Referencia de Transferencia (BAC / LAFISE)'}
                    </label>
                    <input
                      value={paymentReference}
                      onChange={e => setPaymentReference(e.target.value)}
                      placeholder={paymentMethod === 'Tarjeta' ? 'Ej: Voucher #4521' : 'Ej: Ref. BAC #987654'}
                    />
                  </div>
                </div>
              )}

              {/* SECCIÓN DE DESCUENTOS AL POR MAYOR */}
              <div className="pos-wholesale-section">
                <div className="wholesale-badge-header">
                  <span className="wholesale-title">
                    <Tag size={13} color="var(--accent)" /> Escala de Mayoreo (Calzado &amp; Joyas):
                  </span>
                  <div className="wholesale-tiers-row">
                    <span className={`tier-badge ${wholesalePct === 5 ? 'active' : ''}`}>
                      3-4 pzas: <strong>5%</strong>
                    </span>
                    <span className={`tier-badge ${wholesalePct === 10 ? 'active' : ''}`}>
                      5-7 pzas: <strong>10%</strong>
                    </span>
                    <span className={`tier-badge ${wholesalePct === 15 ? 'active' : ''}`}>
                      8+ pzas: <strong>15%</strong>
                    </span>
                  </div>
                </div>

                {wholesalePct > 0 ? (
                  <div className="wholesale-applied-alert">
                    <Sparkles size={14} color="var(--accent)" />
                    <span>
                      🎉 <strong>¡Mayoreo {wholesalePct}% aplicado!</strong> Ahorro de -{formatCurrency(wholesaleDiscountAmount)}
                    </span>
                  </div>
                ) : cart.length > 0 ? (
                  <div className="wholesale-upsell-tip">
                    💡 Agrega {wholesaleTier.nextTierPieces} {wholesaleTier.nextTierPieces === 1 ? 'artículo más' : 'artículos más'} para desbloquear <strong>5% de mayoreo</strong>.
                  </div>
                ) : null}

                {wholesalePct > 0 && wholesaleTier.nextTierPieces > 0 && (
                  <div className="wholesale-upsell-tip">
                    ⭐ Agrega {wholesaleTier.nextTierPieces} {wholesaleTier.nextTierPieces === 1 ? 'más' : 'más'} para subir a <strong>{wholesaleTier.nextPercent}% de descuento</strong>.
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginTop: 6, marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ marginBottom: 0 }}>Descuento Adicional Manual (C$)</label>
                  <input
                    type="number"
                    className="discount-input"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. BARRA INFERIOR FIJA Y SIEMPRE VISIBLE PARA COBRAR */}
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

            <button
              className={`btn btn-primary btn-lg btn-full btn-cobrar ${
                isCashShort ? 'btn-danger' : isCashEmpty && paymentMethod === 'Efectivo' ? 'btn-muted-cobrar' : ''
              }`}
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || !isCashValid}
              title={
                cart.length === 0
                  ? 'Agrega productos para cobrar'
                  : isCashShort
                  ? `Faltan ${formatCurrency(cashShortage)}`
                  : isCashEmpty
                  ? 'Ingresa el efectivo recibido'
                  : ''
              }
            >
              {cart.length === 0 ? (
                <>
                  <ShoppingCart size={20} /> Agrega artículos para cobrar
                </>
              ) : isCashShort ? (
                <>
                  <AlertTriangle size={18} /> Faltan {formatCurrency(cashShortage)}
                </>
              ) : isCashEmpty ? (
                <>
                  <Banknote size={18} /> Ingresa efectivo (o toca "Exacto")
                </>
              ) : (
                <>
                  <CheckCircle size={20} /> Cobrar {formatCurrency(total)}
                  {paymentMethod === 'Efectivo' && changeDue > 0 ? ` (Cambio: ${formatCurrency(changeDue)})` : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL SELECTOR DE TALLA PARA CALZADO */}
      {sizePickerProduct && (
        <div className="modal-overlay" onClick={() => setSizePickerProduct(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Layers size={18} color="var(--accent)" /> Seleccionar Talla
              </h2>
              <button className="icon-btn" onClick={() => setSizePickerProduct(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                Elige la talla de <strong>{sizePickerProduct.name}</strong> para agregar al carrito:
              </p>
              <div className="size-selector-grid">
                {Object.entries(sizePickerProduct.sizesStock || {})
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([sz, stockCount]) => {
                    const available = Number(stockCount) > 0;
                    const isEur = Number(sz) >= 30;
                    return (
                      <button
                        key={sz}
                        className={`size-pick-card ${available ? 'available' : 'unavailable'}`}
                        disabled={!available}
                        onClick={() => addToCart(sizePickerProduct, sz)}
                      >
                        <span className="size-tag-num">{isEur ? `EUR #${sz}` : `US #${sz}`}</span>
                        <small className="size-tag-stock">
                          {available ? `${stockCount} en stock` : 'Agotada'}
                        </small>
                      </button>
                    );
                  })}
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
    </div>
  );
}
