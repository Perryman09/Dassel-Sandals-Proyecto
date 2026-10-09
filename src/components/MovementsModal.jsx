import { useState } from 'react';
import { History, ArrowDownLeft, ArrowUpRight, Search, X, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function MovementsModal({ onClose }) {
  const { movements } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const formatDate = (d) => new Date(d).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const filtered = movements.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.productName.toLowerCase().includes(q) || m.productCode.toLowerCase().includes(q) || (m.reason && m.reason.toLowerCase().includes(q));
    const matchType = typeFilter === 'all' || m.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><History size={20} color="var(--accent)" /> Historial de Movimientos de Inventario (Kardex)</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="filters-bar" style={{ marginBottom: 16 }}>
            <div className="search-input" style={{ flex: 2 }}>
              <Search size={16} />
              <input
                placeholder="Buscar por producto, código o motivo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">Todos los tipos</option>
              <option value="entrada">🟢 Entradas (Compras/Devoluciones)</option>
              <option value="salida">🔴 Salidas (Ventas/Mermas)</option>
              <option value="ajuste">🟡 Ajustes de conteo</option>
            </select>
          </div>

          <div className="table-wrapper" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Stock Resultante</th>
                  <th>Motivo / Referencia</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-cell">No se registran movimientos con este filtro</td>
                  </tr>
                ) : (
                  filtered.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(m.date)}</td>
                      <td>
                        <span className={`badge ${m.type === 'entrada' ? 'badge-success' : m.type === 'salida' ? 'badge-danger' : 'badge-warning'}`}>
                          {m.type === 'entrada' ? 'Entrada' : m.type === 'salida' ? 'Salida' : 'Ajuste'}
                        </span>
                      </td>
                      <td><code>{m.productCode}</code></td>
                      <td><strong>{m.productName}</strong></td>
                      <td>
                        <span style={{
                          fontWeight: 700,
                          color: m.type === 'entrada' ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {m.type === 'entrada' ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>
                      </td>
                      <td><strong>{m.remainingStock}</strong> pzas</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{m.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
