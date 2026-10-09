import { useState } from 'react';
import {
  Package, DollarSign, TrendingUp, ShoppingCart,
  AlertTriangle, Clock, Banknote, Sparkles, Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTime } from '../utils/format';
import { DailySalesChart, CategoryDonutChart } from './InteractiveCharts';
import CashRegisterModal from './CashRegisterModal';

export default function Dashboard({ onNavigate }) {
  const { products, sales, getStats } = useApp();
  const [showCashModal, setShowCashModal] = useState(false);
  const stats = getStats();

  const recentSales = [...sales]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const kpis = [
    {
      label: 'Productos Activos',
      value: stats.activeProducts || 0,
      sub: `${stats.totalProducts || 0} registrados (${stats.totalStockUnits || 0} pzas)`,
      Icon: Package,
      color: 'var(--info)',
      bg: 'var(--info-bg)',
    },
    {
      label: 'Valor en Inventario',
      value: formatCurrency(stats.totalStockCostValue || stats.totalStockValue),
      sub: `P. Venta: ${formatCurrency(stats.totalStockSaleValue || stats.totalSaleValue)}`,
      Icon: DollarSign,
      color: 'var(--success)',
      bg: 'var(--success-bg)',
    },
    {
      label: 'Ventas del Mes',
      value: stats.monthSalesCount || 0,
      sub: `Hoy: ${stats.todaySalesCount || 0} ventas`,
      Icon: ShoppingCart,
      color: 'var(--accent)',
      bg: 'var(--accent-bg)',
    },
    {
      label: 'Ingresos del Mes',
      value: formatCurrency(stats.monthRevenue),
      sub: `Ganancia estimada: ${formatCurrency(stats.monthProfit)} (${stats.profitMargin}%)`,
      Icon: TrendingUp,
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.1)',
    },
  ];

  const alerts = [...(stats.outOfStockProducts || []), ...(stats.lowStockProducts || [])];

  // Ventas agrupadas por categoría para la gráfica
  let zapRevenue = 0;
  let joyRevenue = 0;
  let zapUnits = 0;
  let joyUnits = 0;

  sales
    .filter(s => s.status === 'completed')
    .forEach(s => {
      (s.items || []).forEach(it => {
        const prod = products.find(p => p.id === it.productId);
        const cat = prod ? prod.category : it.productCode.startsWith('DS-ZAP') ? 'zapatos' : 'joyas';
        const itemSub = Number(it.subtotal) || Number(it.price) * Number(it.quantity);
        if (cat === 'zapatos') {
          zapRevenue += itemSub;
          zapUnits += Number(it.quantity);
        } else {
          joyRevenue += itemSub;
          joyUnits += Number(it.quantity);
        }
      });
    });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard Ejecutivo</h1>
          <p>Visión general de Dassel Sandals — Moneda oficial: Córdobas (C$)</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setShowCashModal(true)}>
            <Banknote size={18} color="var(--accent)" /> Control de Caja &amp; Gastos
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('new-sale')}>
            <ShoppingCart size={18} /> Nueva Venta
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid">
        {kpis.map(({ label, value, sub, Icon, color, bg }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-icon" style={{ background: bg, color }}>
              <Icon size={22} />
            </div>
            <div className="kpi-info">
              <span className="kpi-value">{value}</span>
              <span className="kpi-label">{label}</span>
              <span className="kpi-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* SECCIÓN DE GRÁFICAS INTERACTIVAS */}
      <div className="charts-dashboard-row">
        <div className="dash-card flex-2">
          <div className="dash-card-header">
            <h3><TrendingUp size={18} color="var(--accent)" /> Tendencia de Ingresos Diarios (C$)</h3>
          </div>
          <DailySalesChart sales={sales} />
        </div>

        <div className="dash-card flex-1">
          <div className="dash-card-header">
            <h3><Package size={18} color="var(--info)" /> Participación de Ventas</h3>
          </div>
          <CategoryDonutChart
            zapRevenue={zapRevenue}
            joyRevenue={joyRevenue}
            zapUnits={zapUnits}
            joyUnits={joyUnits}
          />
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Alertas de Stock */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3><AlertTriangle size={18} color="var(--warning)" /> Alertas de Existencias</h3>
            <button className="link-btn" onClick={() => onNavigate('inventory')}>
              Gestionar Inventario
            </button>
          </div>
          {alerts.length === 0 ? (
            <p className="empty-msg">✅ Todo el inventario está en niveles óptimos</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Stock</th>
                    <th>Mínimo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map(p => (
                    <tr key={p.id}>
                      <td><code>{p.code}</code></td>
                      <td>
                        <strong>{p.name}</strong>
                        <small style={{ display: 'block', color: 'var(--text-muted)' }}>
                          {p.subcategory} {p.category === 'zapatos' && p.sizesStock ? `· ${Object.entries(p.sizesStock).filter(([, q]) => q > 0).map(([sz, q]) => `T${sz}(${q})`).join(' ')}` : ''}
                        </small>
                      </td>
                      <td>
                        <strong style={{ color: p.stock === 0 ? 'var(--danger)' : 'var(--warning)' }}>
                          {p.stock}
                        </strong>
                      </td>
                      <td>{p.minStock}</td>
                      <td>
                        <span className={`badge ${p.stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                          {p.stock === 0 ? 'Agotado' : 'Stock Bajo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ventas Recientes */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3><Clock size={18} color="var(--accent)" /> Últimas Ventas</h3>
            <button className="link-btn" onClick={() => onNavigate('sales')}>
              Ver Historial
            </button>
          </div>
          {recentSales.length === 0 ? (
            <p className="empty-msg">No se han registrado ventas aún</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map(s => (
                    <tr key={s.id}>
                      <td><code>{s.saleNumber}</code></td>
                      <td>{s.customerName}</td>
                      <td><strong>{formatCurrency(s.total)}</strong></td>
                      <td style={{ fontSize: '0.8rem' }}>{formatDateTime(s.date)}</td>
                      <td>
                        <span className={`badge ${s.status === 'completed' ? 'badge-success' : 'badge-danger'}`}>
                          {s.status === 'completed' ? 'Completada' : 'Cancelada'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resumen por Línea de Negocio */}
        <div className="dash-card full-width">
          <div className="dash-card-header">
            <h3><Package size={18} color="var(--info)" /> Resumen de Inventario en Bodega</h3>
          </div>
          <div className="category-summary">
            <div className="category-block">
              <div className="cat-header">
                <span className="cat-emoji">👡</span>
                <div>
                  <h4>Calzado &amp; Sandalias</h4>
                  <small style={{ color: 'var(--text-muted)' }}>Huaraches, Plataformas, Flats con matriz de tallas</small>
                </div>
              </div>
              <div className="cat-stats">
                <div>
                  <span>{products.filter(p => p.category === 'zapatos').length}</span>
                  <small>Modelos</small>
                </div>
                <div>
                  <span>{products.filter(p => p.category === 'zapatos').reduce((s, p) => s + (Number(p.stock) || 0), 0)}</span>
                  <small>Pares en Stock</small>
                </div>
                <div>
                  <span>
                    {formatCurrency(
                      products
                        .filter(p => p.category === 'zapatos')
                        .reduce((s, p) => s + (Number(p.stock) || 0) * (Number(p.salePrice) || 0), 0)
                    )}
                  </span>
                  <small>Valor Comercial (C$)</small>
                </div>
              </div>
            </div>

            <div className="category-block">
              <div className="cat-header">
                <span className="cat-emoji">💎</span>
                <div>
                  <h4>Joyería &amp; Accesorios</h4>
                  <small style={{ color: 'var(--text-muted)' }}>Collares, Aretes, Pulseras, Anillos</small>
                </div>
              </div>
              <div className="cat-stats">
                <div>
                  <span>{products.filter(p => p.category === 'joyas').length}</span>
                  <small>Modelos</small>
                </div>
                <div>
                  <span>{products.filter(p => p.category === 'joyas').reduce((s, p) => s + (Number(p.stock) || 0), 0)}</span>
                  <small>Pzas en Stock</small>
                </div>
                <div>
                  <span>
                    {formatCurrency(
                      products
                        .filter(p => p.category === 'joyas')
                        .reduce((s, p) => s + (Number(p.stock) || 0) * (Number(p.salePrice) || 0), 0)
                    )}
                  </span>
                  <small>Valor Comercial (C$)</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCashModal && <CashRegisterModal onClose={() => setShowCashModal(false)} />}
    </div>
  );
}
