import { useState } from 'react';
import {
  Banknote, ArrowDownRight, ArrowUpRight, X, Plus,
  Receipt, ShoppingBag, Truck, Coffee, Wrench, Calendar, Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTime } from '../utils/format';

const EXPENSE_CATEGORIES = [
  { id: 'Empaque Boutique', label: '🛍️ Bolsas y Empaque Boutique' },
  { id: 'Paquetería y Envíos', label: '📦 Paquetería y Envíos' },
  { id: 'Limpieza y Tienda', label: '🧹 Insumos de Tienda / Limpieza' },
  { id: 'Transporte', label: '🚕 Transporte / Diligencias' },
  { id: 'Refrigerio', label: '☕ Alimentos / Refrigerio Personal' },
  { id: 'Servicios', label: '⚡ Servicios y Mantenimiento' },
  { id: 'Otro', label: '📝 Otro Gasto Menor' },
];

export default function CashRegisterModal({ onClose }) {
  const { getCashBalance, addCashMovement } = useApp();
  const balance = getCashBalance();

  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'new-expense' | 'new-entry'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].id);
  const [description, setDescription] = useState('');

  const handleSubmitExpense = (e) => {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0) return;

    addCashMovement({
      type: 'salida',
      category,
      description: description.trim() || category,
      amount: val,
    });

    setAmount('');
    setDescription('');
    setActiveTab('summary');
  };

  const handleSubmitEntry = (e) => {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0) return;

    addCashMovement({
      type: 'entrada',
      category: 'Aporte de Efectivo',
      description: description.trim() || 'Ingreso de efectivo para cambio',
      amount: val,
    });

    setAmount('');
    setDescription('');
    setActiveTab('summary');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Banknote size={22} color="var(--accent)" /> Control de Caja &amp; Salidas Menores
          </h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Tarjeta de Saldo en Cajón */}
          <div className="cash-balance-card">
            <div className="cash-balance-info">
              <span className="cash-balance-label">Efectivo Estimado en Cajón</span>
              <span className="cash-balance-val">{formatCurrency(balance.saldoEsperado)}</span>
              <small style={{ color: 'var(--text-muted)' }}>
                Arqueo en tiempo real del turno de hoy (Moneda: Córdobas C$)
              </small>
            </div>

            <div className="cash-breakdown-mini">
              <div className="cash-pill">
                <small>Fondo Inicial</small>
                <strong>{formatCurrency(balance.totalApertura)}</strong>
              </div>
              <div className="cash-pill success">
                <small>(+) Ventas Efectivo</small>
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

          {/* Botones de Acción */}
          <div className="cash-actions-bar">
            <button
              className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('summary')}
            >
              Historial de Hoy ({balance.movements.length})
            </button>
            <button
              className={`btn ${activeTab === 'new-expense' ? 'btn-danger' : 'btn-ghost'}`}
              onClick={() => setActiveTab('new-expense')}
            >
              <ArrowDownRight size={16} /> Registrar Salida Menor (Gasto)
            </button>
            <button
              className={`btn ${activeTab === 'new-entry' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('new-entry')}
            >
              <ArrowUpRight size={16} /> Ingresar Efectivo a Caja
            </button>
          </div>

          {/* PESTAÑA 1: FORMULARIO NUEVO GASTO / SALIDA */}
          {activeTab === 'new-expense' && (
            <form onSubmit={handleSubmitExpense} className="cash-form-box">
              <h3 style={{ marginBottom: 14, color: 'var(--danger)' }}>
                <ArrowDownRight size={18} /> Registrar Salida de Efectivo
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

          {/* PESTAÑA 2: FORMULARIO INGRESO DE EFECTIVO */}
          {activeTab === 'new-entry' && (
            <form onSubmit={handleSubmitEntry} className="cash-form-box">
              <h3 style={{ marginBottom: 14, color: 'var(--success)' }}>
                <ArrowUpRight size={18} /> Ingreso de Efectivo a Caja
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

          {/* PESTAÑA 3: HISTORIAL DE MOVIMIENTOS DE CAJA DE HOY */}
          {activeTab === 'summary' && (
            <div className="table-wrapper" style={{ marginTop: 12, maxHeight: 320, overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Tipo</th>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th style={{ textAlign: 'right' }}>Monto (C$)</th>
                  </tr>
                </thead>
                <tbody>
                  {balance.movements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-cell">
                        No hay movimientos de caja registrados hoy aún
                      </td>
                    </tr>
                  ) : (
                    balance.movements.map(m => (
                      <tr key={m.id}>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {formatDateTime(m.date)}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              m.type === 'salida'
                                ? 'badge-danger'
                                : m.type === 'apertura'
                                ? 'badge-info'
                                : 'badge-success'
                            }`}
                          >
                            {m.type === 'salida' ? 'Salida / Gasto' : m.type === 'apertura' ? 'Apertura' : 'Entrada'}
                          </span>
                        </td>
                        <td><strong>{m.category}</strong></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{m.description}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          <span style={{ color: m.type === 'salida' ? 'var(--danger)' : 'var(--success)' }}>
                            {m.type === 'salida' ? `-${formatCurrency(m.amount)}` : `+${formatCurrency(m.amount)}`}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
