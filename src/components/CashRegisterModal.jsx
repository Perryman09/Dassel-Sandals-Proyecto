import { useState } from 'react';
import {
  Banknote, ArrowDownRight, ArrowUpRight, X, Plus,
  Receipt, ShoppingBag, Truck, Coffee, Wrench, Calendar, Sparkles,
  Lock, Unlock, CheckCircle, AlertTriangle, Calculator, User
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTime } from '../utils/format';

const EXPENSE_CATEGORIES = [
  { id: 'Empaque Boutique', label: 'Bolsas y Empaque Boutique' },
  { id: 'Paquetería y Envíos', label: 'Paquetería y Envíos' },
  { id: 'Limpieza y Tienda', label: 'Insumos de Tienda / Limpieza' },
  { id: 'Transporte', label: 'Transporte / Diligencias' },
  { id: 'Refrigerio', label: 'Alimentos / Refrigerio Personal' },
  { id: 'Servicios', label: 'Servicios y Mantenimiento' },
  { id: 'Otro', label: 'Otro Gasto Menor' },
];

export default function CashRegisterModal({ onClose }) {
  const { getCashBalance, addCashMovement, currentUser } = useApp();
  const balance = getCashBalance();

  // Si la caja está cerrada o sin abrir hoy, sugerir pestaña de resumen o abrir caja fácilmente
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'open-register' | 'close-register' | 'new-expense' | 'new-entry'
  const [filterScope, setFilterScope] = useState('today'); // 'shift' | 'today' | 'all'

  // Estados para Gasto / Entrada
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].id);
  const [description, setDescription] = useState('');

  // Estados para ABRIR CAJA (Turno de Hoy)
  const [openingAmount, setOpeningAmount] = useState('');
  const [openingResponsible, setOpeningResponsible] = useState(
    currentUser?.name || currentUser?.username || 'Administración'
  );
  const [openingNotes, setOpeningNotes] = useState('');

  // Estados para CERRAR CAJA (Arqueo / Corte de Turno)
  const [countedCash, setCountedCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  const displayedMovements =
    filterScope === 'shift'
      ? balance.activeShiftMovements || balance.movements
      : filterScope === 'today'
      ? balance.movements
      : balance.allMovements || balance.movements;

  // --- 1. ABRIR CAJA (INICIAR TURNO DE HOY) ---
  const handleOpenRegister = async (e) => {
    e.preventDefault();
    const val = Number(openingAmount) || 0;
    if (val < 0) {
      alert('El fondo inicial no puede ser negativo');
      return;
    }

    const shiftLabel = `Turno #${(balance.shiftNumber || 1) + (balance.shiftStatus === 'closed' ? 1 : 0)}`;
    const desc = openingNotes.trim()
      ? `Apertura de Caja (${shiftLabel}) — ${openingNotes.trim()}`
      : `Apertura de Caja (${shiftLabel}) — Fondo inicial en cajón`;

    await addCashMovement({
      type: 'apertura',
      category: 'Apertura de Caja',
      description: desc,
      amount: val,
      responsible: openingResponsible.trim() || 'Administración',
    });

    setOpeningAmount('');
    setOpeningNotes('');
    setFilterScope('shift');
    setActiveTab('summary');
  };

  // --- 2. CERRAR CAJA (CORTE Y ARQUEO DE TURNO DE HOY) ---
  const handleCloseRegister = async (e) => {
    e.preventDefault();
    const expected = Number(balance.saldoEsperado) || 0;
    const counted = countedCash === '' ? expected : Number(countedCash);

    if (isNaN(counted) || counted < 0) {
      alert('Ingresa un monto físico contado válido');
      return;
    }

    const diff = counted - expected;
    const diffText =
      Math.abs(diff) < 0.01
        ? 'Cuadre Exacto (C$ 0.00)'
        : diff > 0
        ? `Sobrante: +${formatCurrency(diff)}`
        : `Faltante: -${formatCurrency(Math.abs(diff))}`;

    const summaryDesc = [
      `Corte de Turno — Esperado: ${formatCurrency(expected)}`,
      `Contado: ${formatCurrency(counted)} (${diffText})`,
      closingNotes.trim() ? `Nota: ${closingNotes.trim()}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    if (
      !window.confirm(
        `¿Confirmar el CIERRE DE CAJA del turno de hoy?\n\n• Efectivo Esperado: ${formatCurrency(expected)}\n• Efectivo Físico Contado: ${formatCurrency(counted)}\n• Resultado: ${diffText}`
      )
    ) {
      return;
    }

    await addCashMovement({
      type: 'cierre',
      category: 'Cierre de Caja',
      description: summaryDesc,
      amount: counted,
      responsible: currentUser?.name || currentUser?.username || 'Administración',
    });

    setCountedCash('');
    setClosingNotes('');
    setFilterScope('today');
    setActiveTab('summary');
  };

  // --- 3. REGISTRAR GASTO / SALIDA ---
  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0) return;

    await addCashMovement({
      type: 'salida',
      category,
      description: description.trim() || category,
      amount: val,
      responsible: currentUser?.name || 'Administración',
    });

    setAmount('');
    setDescription('');
    setFilterScope('today');
    setActiveTab('summary');
  };

  // --- 4. REGISTRAR INGRESO / APORTE ---
  const handleSubmitEntry = async (e) => {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0) return;

    await addCashMovement({
      type: 'entrada',
      category: 'Aporte de Efectivo',
      description: description.trim() || 'Ingreso de efectivo para cambio',
      amount: val,
      responsible: currentUser?.name || 'Administración',
    });

    setAmount('');
    setDescription('');
    setFilterScope('today');
    setActiveTab('summary');
  };

  // Cálculo en vivo de diferencia para la pestaña de Cerrar Caja
  const expectedDrawer = Number(balance.saldoEsperado) || 0;
  const countedNum = countedCash === '' ? expectedDrawer : Number(countedCash) || 0;
  const closingDiff = countedNum - expectedDrawer;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2>
              <Banknote size={22} color="var(--accent)" /> Control de Caja, Turnos &amp; Gastos
            </h2>
            {balance.shiftStatus === 'open' ? (
              <span
                className="badge badge-success"
                style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Unlock size={13} /> CAJA ABIERTA (Turno Activo)
              </span>
            ) : balance.shiftStatus === 'closed' ? (
              <span
                className="badge badge-danger"
                style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Lock size={13} /> CAJA CERRADA
              </span>
            ) : (
              <span
                className="badge badge-warning"
                style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Calendar size={13} /> TURNO SIN APERTURA INICIAL HOY
              </span>
            )}
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Tarjeta de Saldo en Cajón y Estado del Turno */}
          <div className="cash-balance-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div className="cash-balance-info">
                <span className="cash-balance-label">
                  {balance.shiftStatus === 'closed'
                    ? 'Efectivo en Cajón (Caja Cerrada)'
                    : 'Efectivo Estimado en Cajón (Turno Actual)'}
                </span>
                <span className="cash-balance-val">{formatCurrency(balance.saldoEsperado)}</span>
                <small style={{ color: 'var(--text-muted)' }}>
                  {balance.shiftStatus === 'open' && balance.lastOpening ? (
                    <>
                      Abierta hoy a las{' '}
                      <strong>
                        {new Date(balance.lastOpening.date).toLocaleTimeString('es-NI', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </strong>{' '}
                      por <strong>{balance.lastOpening.responsible || 'Administración'}</strong>
                    </>
                  ) : balance.shiftStatus === 'closed' ? (
                    <>
                      Turno cerrado hoy{balance.lastClosing ? ` a las ${new Date(balance.lastClosing.date).toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' })}` : ''}
                      {balance.autoClosedAt7pm
                        ? ' · Cierre automático por regla de las 7:00 PM'
                        : balance.lastClosing
                        ? ` · Contado al cierre: ${formatCurrency(balance.lastClosing.amount)}`
                        : ''}
                    </>
                  ) : (
                    'Aún no has registrado la apertura de caja de hoy. Haz clic en "Abrir Caja" para ingresar el fondo inicial.'
                  )}
                </small>
              </div>

              {/* Botones rápidos de Abrir / Cerrar Turno directamente en la tarjeta */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {balance.shiftStatus !== 'open' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ background: 'var(--success)', color: '#0f172a', fontWeight: 800 }}
                    onClick={() => setActiveTab('open-register')}
                  >
                    <Unlock size={16} /> Abrir Caja (Iniciar Turno)
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{
                      borderColor: 'var(--warning)',
                      color: 'var(--accent-light)',
                      background: 'rgba(245, 158, 11, 0.12)',
                      fontWeight: 700,
                    }}
                    onClick={() => {
                      setCountedCash(String(balance.saldoEsperado || 0));
                      setActiveTab('close-register');
                    }}
                  >
                    <Lock size={16} /> Cerrar Caja (Corte de Turno)
                  </button>
                )}
              </div>
            </div>

            <div className="cash-breakdown-mini">
              <div className="cash-pill">
                <small>(+) Fondo Inicial</small>
                <strong>{formatCurrency(balance.totalApertura)}</strong>
              </div>
              <div className="cash-pill success">
                <small>(+) Ventas Efectivo ({balance.cashSalesCount || 0})</small>
                <strong>{formatCurrency(balance.cashSalesToday)}</strong>
              </div>
              <div className="cash-pill info">
                <small>(+) Aportes</small>
                <strong>{formatCurrency(balance.totalEntradas)}</strong>
              </div>
              <div className="cash-pill danger">
                <small>(-) Salidas / Gastos</small>
                <strong>{formatCurrency(balance.totalSalidas)}</strong>
              </div>
            </div>
          </div>

          {/* Barra de Navegación de Acciones de Caja */}
          <div className="cash-actions-bar">
            <button
              type="button"
              className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('summary')}
            >
              Historial ({balance.movements.length} hoy)
            </button>

            <button
              type="button"
              className={`btn ${activeTab === 'open-register' ? 'btn-primary' : 'btn-ghost'}`}
              style={
                activeTab === 'open-register'
                  ? { background: 'var(--success)', color: '#0f172a' }
                  : { borderColor: 'rgba(34, 197, 94, 0.4)', color: '#4ade80' }
              }
              onClick={() => setActiveTab('open-register')}
            >
              <Unlock size={16} /> Abrir Caja
            </button>

            <button
              type="button"
              className={`btn ${activeTab === 'close-register' ? 'btn-primary' : 'btn-ghost'}`}
              style={
                activeTab === 'close-register'
                  ? { background: 'var(--warning)', color: '#0f172a' }
                  : { borderColor: 'rgba(245, 158, 11, 0.4)', color: 'var(--accent-light)' }
              }
              onClick={() => {
                setCountedCash(String(balance.saldoEsperado || 0));
                setActiveTab('close-register');
              }}
            >
              <Lock size={16} /> Cerrar Caja
            </button>

            <button
              type="button"
              className={`btn ${activeTab === 'new-expense' ? 'btn-danger' : 'btn-ghost'}`}
              onClick={() => setActiveTab('new-expense')}
            >
              <ArrowDownRight size={16} /> Registrar Gasto
            </button>

            <button
              type="button"
              className={`btn ${activeTab === 'new-entry' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('new-entry')}
            >
              <ArrowUpRight size={16} /> Ingresar Efectivo
            </button>
          </div>

          {/* PESTAÑA: ABRIR CAJA (INICIAR TURNO DE HOY) */}
          {activeTab === 'open-register' && (
            <form onSubmit={handleOpenRegister} className="cash-form-box" style={{ borderColor: 'rgba(34, 197, 94, 0.4)' }}>
              <h3 style={{ marginBottom: 8, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Unlock size={19} /> Abrir Caja — Iniciar Turno de Hoy
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                Registra el efectivo inicial (sencillo / morralla / billetes para cambio) con el que inicia el cajero este turno.
              </p>

              <div className="form-row">
                <div className="form-group">
                  <label>Fondo Inicial en Cajón (C$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={openingAmount}
                    onChange={e => setOpeningAmount(e.target.value)}
                    placeholder="Ej: 1000.00"
                    autoFocus
                    required
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {[0, 500, 1000, 1500, 2000, 3000].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                        onClick={() => setOpeningAmount(String(preset))}
                      >
                        C$ {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label><User size={14} /> Cajero / Responsable del Turno</label>
                  <input
                    value={openingResponsible}
                    onChange={e => setOpeningResponsible(e.target.value)}
                    placeholder="Nombre del cajero o encargado"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Observaciones de Apertura (Opcional)</label>
                <input
                  value={openingNotes}
                  onChange={e => setOpeningNotes(e.target.value)}
                  placeholder="Ej: Turno Mañana — Billetes de C$10, C$20, C$50 y C$100 para vuelto"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setActiveTab('summary')}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'var(--success)', color: '#0f172a', fontWeight: 800 }}
                >
                  <Unlock size={16} /> Confirmar Apertura de Caja
                </button>
              </div>
            </form>
          )}

          {/* PESTAÑA: CERRAR CAJA (ARQUEO Y CORTE DE TURNO DE HOY) */}
          {activeTab === 'close-register' && (
            <form onSubmit={handleCloseRegister} className="cash-form-box" style={{ borderColor: 'rgba(245, 158, 11, 0.45)' }}>
              <h3 style={{ marginBottom: 8, color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={19} /> Cerrar Caja — Arqueo y Corte del Turno de Hoy
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                Verifica el resumen de ingresos y egresos del turno actual e ingresa el efectivo físico contado en el cajón para cuadrar la caja.
              </p>

              {/* Resumen del Turno antes de cerrar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
                  gap: 10,
                  marginBottom: 16,
                  padding: 12,
                  background: 'var(--bg-primary)',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'block' }}>
                    (+) Fondo Inicial Apertura
                  </span>
                  <strong style={{ fontSize: '0.98rem' }}>{formatCurrency(balance.totalApertura)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'block' }}>
                    (+) Ventas en Efectivo ({balance.cashSalesCount || 0})
                  </span>
                  <strong style={{ fontSize: '0.98rem', color: '#4ade80' }}>
                    {formatCurrency(balance.cashSalesToday)}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'block' }}>
                    (+) Aportes Extra
                  </span>
                  <strong style={{ fontSize: '0.98rem', color: 'var(--info)' }}>
                    {formatCurrency(balance.totalEntradas)}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'block' }}>
                    (-) Gastos / Salidas Caja
                  </span>
                  <strong style={{ fontSize: '0.98rem', color: '#f87171' }}>
                    -{formatCurrency(balance.totalSalidas)}
                  </strong>
                </div>
                <div
                  style={{
                    borderLeft: '2px solid var(--accent)',
                    paddingLeft: 10,
                  }}
                >
                  <span style={{ fontSize: '0.73rem', color: 'var(--accent)', fontWeight: 700, display: 'block' }}>
                    (=) EFECTIVO ESPERADO
                  </span>
                  <strong style={{ fontSize: '1.12rem', color: 'var(--accent-light)' }}>
                    {formatCurrency(expectedDrawer)}
                  </strong>
                </div>
              </div>

              {/* Información adicional de ventas con Tarjeta y Transferencia en el turno */}
              {(balance.cardSalesToday > 0 || balance.transferSalesToday > 0) && (
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginBottom: 14,
                    padding: '8px 12px',
                    background: 'rgba(59, 130, 246, 0.08)',
                    borderRadius: 8,
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                  }}
                >
                  <strong>Otros cobros del turno (No afectan efectivo físico):</strong>{' '}
                  Tarjeta POS: <strong>{formatCurrency(balance.cardSalesToday)}</strong> · Transferencias:{' '}
                  <strong>{formatCurrency(balance.transferSalesToday)}</strong>
                </div>
              )}

              <div className="form-row" style={{ alignItems: 'flex-start' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ marginBottom: 0 }}>Efectivo Físico Contado en Cajón (C$) *</label>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '2px 8px', fontSize: '0.72rem', color: 'var(--accent)' }}
                      onClick={() => setCountedCash(String(expectedDrawer))}
                    >
                      Usar Esperado ({formatCurrency(expectedDrawer)})
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={countedCash}
                    onChange={e => setCountedCash(e.target.value)}
                    placeholder={String(expectedDrawer)}
                    autoFocus
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Resultado del Arqueo (Diferencia)</label>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background:
                        Math.abs(closingDiff) < 0.01
                          ? 'rgba(34, 197, 94, 0.15)'
                          : closingDiff > 0
                          ? 'rgba(59, 130, 246, 0.15)'
                          : 'rgba(239, 68, 68, 0.15)',
                      border: `1px solid ${
                        Math.abs(closingDiff) < 0.01
                          ? 'rgba(34, 197, 94, 0.5)'
                          : closingDiff > 0
                          ? 'rgba(59, 130, 246, 0.5)'
                          : 'rgba(239, 68, 68, 0.5)'
                      }`,
                      color:
                        Math.abs(closingDiff) < 0.01
                          ? '#4ade80'
                          : closingDiff > 0
                          ? '#60a5fa'
                          : '#f87171',
                    }}
                  >
                    {Math.abs(closingDiff) < 0.01 ? (
                      <>
                        <CheckCircle size={17} /> Caja Cuadrada Exacta (C$ 0.00)
                      </>
                    ) : closingDiff > 0 ? (
                      <>
                        <Sparkles size={17} /> Sobrante: +{formatCurrency(closingDiff)}
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={17} /> Faltante: -{formatCurrency(Math.abs(closingDiff))}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Observaciones del Cierre de Turno (Opcional)</label>
                <input
                  value={closingNotes}
                  onChange={e => setClosingNotes(e.target.value)}
                  placeholder="Ej: Se retiran C$ 3,500 para depósito bancario y quedan C$ 500 de fondo..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setActiveTab('summary')}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'var(--warning)', color: '#0f172a', fontWeight: 800 }}
                >
                  <Lock size={16} /> Confirmar Cierre de Caja del Turno
                </button>
              </div>
            </form>
          )}

          {/* PESTAÑA: FORMULARIO NUEVO GASTO / SALIDA */}
          {activeTab === 'new-expense' && (
            <form onSubmit={handleSubmitExpense} className="cash-form-box">
              <h3 style={{ marginBottom: 14, color: 'var(--danger)' }}>
                <ArrowDownRight size={18} /> Registrar Salida de Efectivo (Gasto)
              </h3>
              <div className="form-row">
                <div className="form-group flex-2">
                  <label>Categoría del Gasto *</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Monto a Retirar (C$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="C$ 0.00"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Detalle / Motivo del Retiro</label>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ej: Compra de 50 bolsas decoradas para sandalias"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setActiveTab('summary')}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-danger">
                  Confirmar Salida de Efectivo
                </button>
              </div>
            </form>
          )}

          {/* PESTAÑA: FORMULARIO INGRESO DE EFECTIVO */}
          {activeTab === 'new-entry' && (
            <form onSubmit={handleSubmitEntry} className="cash-form-box">
              <h3 style={{ marginBottom: 14, color: 'var(--success)' }}>
                <ArrowUpRight size={18} /> Ingreso de Efectivo a Caja (Aporte)
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Monto a Ingresar (C$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="C$ 0.00"
                    autoFocus
                    required
                  />
                </div>
                <div className="form-group flex-2">
                  <label>Motivo del Ingreso</label>
                  <input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ej: Aporte de monedas y billetes pequeños para dar cambio"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setActiveTab('summary')}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar Entrada de Efectivo
                </button>
              </div>
            </form>
          )}

          {/* PESTAÑA: HISTORIAL DE MOVIMIENTOS DE CAJA */}
          {activeTab === 'summary' && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${filterScope === 'shift' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setFilterScope('shift')}
                    style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                  >
                    Turno Actual ({(balance.activeShiftMovements || []).length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${filterScope === 'today' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setFilterScope('today')}
                    style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                  >
                    Todo Hoy ({balance.movements.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${filterScope === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setFilterScope('all')}
                    style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                  >
                    Todo el Historial ({(balance.allMovements || []).length})
                  </button>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {filterScope === 'shift'
                    ? 'Movimientos del turno activo'
                    : filterScope === 'today'
                    ? 'Todos los movimientos y cierres de hoy'
                    : 'Historial completo guardado'}
                </span>
              </div>

              <div className="table-wrapper" style={{ maxHeight: 320, overflowY: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha / Hora</th>
                      <th>Tipo</th>
                      <th>Categoría</th>
                      <th>Descripción / Responsable</th>
                      <th style={{ textAlign: 'right' }}>Monto (C$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedMovements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="empty-cell" style={{ padding: '24px 12px', textAlign: 'center' }}>
                          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                            {filterScope === 'shift'
                              ? 'No hay movimientos en el turno actual. Haz clic en "Abrir Caja" para iniciar turno.'
                              : filterScope === 'today'
                              ? 'No hay movimientos de caja registrados hoy aún.'
                              : 'No hay movimientos de caja en el historial.'}
                          </p>
                          {filterScope !== 'all' && (balance.allMovements || []).length > 0 && (
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              style={{ marginTop: 8, color: 'var(--accent)' }}
                              onClick={() => setFilterScope('all')}
                            >
                              Ver {(balance.allMovements || []).length} movimientos de fechas anteriores
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      displayedMovements.map(m => {
                        const isSalida = m.type === 'salida' || m.type === 'egreso';
                        const isApertura = m.type === 'apertura';
                        const isCierre = m.type === 'cierre';
                        const badgeClass = isSalida
                          ? 'badge-danger'
                          : isApertura
                          ? 'badge-info'
                          : isCierre
                          ? 'badge-warning'
                          : 'badge-success';
                        const badgeText = isSalida
                          ? 'Salida / Gasto'
                          : isApertura
                          ? 'Apertura'
                          : isCierre
                          ? 'Cierre Turno'
                          : 'Entrada';
                        const categoryText =
                          m.category ||
                          m.notes ||
                          (isSalida
                            ? 'Gasto Menor'
                            : isApertura
                            ? 'Apertura de Caja'
                            : isCierre
                            ? 'Cierre de Caja'
                            : 'Aporte de Efectivo');
                        const descriptionText = m.description || m.reason || 'Movimiento de caja';
                        const amountColor = isSalida
                          ? 'var(--danger)'
                          : isCierre
                          ? 'var(--accent-light)'
                          : 'var(--success)';
                        const amountText = isSalida
                          ? `-${formatCurrency(m.amount)}`
                          : isCierre
                          ? `${formatCurrency(m.amount)}`
                          : `+${formatCurrency(m.amount)}`;

                        return (
                          <tr key={m.id}>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {formatDateTime(m.date)}
                            </td>
                            <td>
                              <span className={`badge ${badgeClass}`}>
                                {badgeText}
                              </span>
                            </td>
                            <td><strong>{categoryText}</strong></td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
                              <div>{descriptionText}</div>
                              {m.responsible && (
                                <small style={{ color: 'var(--text-muted)' }}>Por: {m.responsible}</small>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>
                              <span style={{ color: amountColor }}>
                                {amountText}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
