import { useState, useMemo } from 'react';
import {
  Package, DollarSign, TrendingUp, ShoppingCart,
  AlertTriangle, Clock, Banknote, Sparkles, Layers, Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTime } from '../utils/format';
import { DailySalesChart, CategoryDonutChart } from './InteractiveCharts';
import CashRegisterModal from './CashRegisterModal';

const PERIOD_OPTIONS = [
  { id: 'today', label: 'Hoy', days: 1 },
  { id: '7d', label: '7 Días', days: 7 },
  { id: '15d', label: '15 Días', days: 15 },
  { id: '30d', label: '30 Días', days: 30 },
  { id: 'all', label: 'Todo el Historial', days: null },
];

export default function Dashboard({ onNavigate }) {
  const { products, sales, categories, getStats, getCashBalance, isShoeCategory } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showCashModal, setShowCashModal] = useState(false);

  const stats = getStats();
  const cashInfo = getCashBalance();

  const isWithinPeriod = (dateValue) => {
    if (!dateValue) return false;

    if (selectedPeriod === 'custom' || dateFrom || dateTo) {
      const dStr = String(dateValue).split('T')[0];
      if (dateFrom && dStr < dateFrom) return false;
      if (dateTo && dStr > dateTo) return false;
      return true;
    }

    if (selectedPeriod === 'all') return true;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (selectedPeriod === 'today') {
      if (String(dateValue).startsWith(todayStr)) return true;
      const d = new Date(dateValue);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }

    const opt = PERIOD_OPTIONS.find(o => o.id === selectedPeriod);
    if (!opt || !opt.days) return true;

    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (opt.days - 1), 0, 0, 0, 0);
    const itemDate = new Date(dateValue);
    return itemDate >= start && itemDate <= now;
  };

  const currentPeriodLabel = useMemo(() => {
    if (dateFrom || dateTo) {
      if (dateFrom && dateTo) return `${dateFrom} al ${dateTo}`;
      if (dateFrom) return `Desde ${dateFrom}`;
      return `Hasta ${dateTo}`;
    }
    return PERIOD_OPTIONS.find(o => o.id === selectedPeriod)?.label || 'Periodo Personalizado';
  }, [selectedPeriod, dateFrom, dateTo]);

  const periodSales = useMemo(
    () => (sales || []).filter(s => isWithinPeriod(s.date)),
    [sales, selectedPeriod, dateFrom, dateTo]
  );

  const recentSales = useMemo(
    () => [...periodSales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    [periodSales]
  );

  // Métricas financieras calculadas según el periodo seleccionado o rango personalizado
  const {
    periodRevenue,
    periodProfit,
    periodSalesCount,
    periodMargin,
    zapRevenue,
    joyRevenue,
    zapUnits,
    joyUnits,
  } = useMemo(() => {
    let rev = 0;
    let cost = 0;
    let count = 0;
    let zapRev = 0;
    let joyRev = 0;
    let zapU = 0;
    let joyU = 0;

    const completed = periodSales.filter(s => s.status === 'completed');
    count = completed.length;

    completed.forEach(s => {
      rev += Number(s.total) || 0;
      (s.items || []).forEach(it => {
        const prod = products.find(p => p.id === it.productId);
        const qty = Number(it.quantity) || 1;
        const unitCost = Number(it.costPrice) || (prod ? Number(prod.costPrice) : Number(it.price) * 0.5);
        cost += unitCost * qty;

        const isShoe = prod
          ? isShoeCategory(prod.category, categories)
          : String(it.productCode || '').startsWith('DS-ZAP') || Boolean(it.size);
        const itemSub = Number(it.subtotal) || Number(it.price) * qty;

        if (isShoe) {
          zapRev += itemSub;
          zapU += qty;
        } else {
          joyRev += itemSub;
          joyU += qty;
        }
      });
    });

    const profit = Math.max(0, rev - cost);
    const margin = rev > 0 ? Math.round((profit / rev) * 100) : 0;

    return {
      periodRevenue: rev,
      periodProfit: profit,
      periodSalesCount: count,
      periodMargin: margin,
      zapRevenue: zapRev,
      joyRevenue: joyRev,
      zapUnits: zapU,
      joyUnits: joyU,
    };
  }, [periodSales, products, categories, isShoeCategory]);

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
      label: `Ventas (${currentPeriodLabel})`,
      value: periodSalesCount,
      sub: `Hoy: ${stats.todaySalesCount || 0} ventas`,
      Icon: ShoppingCart,
      color: 'var(--accent)',
      bg: 'var(--accent-bg)',
    },
    {
      label: `Ingresos (${currentPeriodLabel})`,
      value: formatCurrency(periodRevenue),
      sub: `Ganancia estimada: ${formatCurrency(periodProfit)} (${periodMargin}%)`,
      Icon: TrendingUp,
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.1)',
    },
  ];

  const alerts = [...(stats.outOfStockProducts || []), ...(stats.lowStockProducts || [])];
  const shoeProducts = products.filter(p => isShoeCategory(p.category, categories));
  const jewelryProducts = products.filter(p => !isShoeCategory(p.category, categories));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard Ejecutivo</h1>
          <p>Visión general de Dassel Sandals — Moneda oficial: Córdobas (C$)</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setShowCashModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Banknote size={18} color="var(--accent)" />
            <span>Control de Caja &amp; Gastos</span>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 999,
                background:
                  cashInfo.shiftStatus === 'open'
                    ? 'rgba(34, 197, 94, 0.16)'
                    : cashInfo.shiftStatus === 'closed'
                    ? 'rgba(239, 68, 68, 0.16)'
                    : 'rgba(245, 158, 11, 0.16)',
                color:
                  cashInfo.shiftStatus === 'open'
                    ? 'var(--success)'
                    : cashInfo.shiftStatus === 'closed'
                    ? 'var(--danger)'
                    : 'var(--accent)',
                border:
                  cashInfo.shiftStatus === 'open'
                    ? '1px solid rgba(34, 197, 94, 0.4)'
                    : cashInfo.shiftStatus === 'closed'
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : '1px solid rgba(245, 158, 11, 0.4)',
              }}
            >
              {cashInfo.shiftStatus === 'open'
                ? '● Abierta'
                : cashInfo.shiftStatus === 'closed'
                ? '● Cerrada'
                : '● Sin abrir'}
            </span>
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('new-sale')}>
            <ShoppingCart size={18} /> Nueva Venta
          </button>
        </div>
      </div>

      {/* BARRA DE CLASIFICACIÓN POR PERIODO Y RANGO DE FECHAS */}
      <div
        className="dash-card"
        style={{
          marginBottom: 20,
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="var(--accent)" />
            <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>
              Periodo:
            </span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              background: 'var(--bg-primary)',
              padding: 4,
              borderRadius: 10,
              border: '1px solid var(--border)',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            {PERIOD_OPTIONS.map(opt => {
              const isActive = selectedPeriod === opt.id && !dateFrom && !dateTo;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSelectedPeriod(opt.id);
                    setDateFrom('');
                    setDateTo('');
                  }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: 'none',
                    fontSize: '0.84rem',
                    fontWeight: isActive ? 700 : 500,
                    background: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive ? '#0f172a' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rango de Fechas Personalizado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div className="date-filter" style={{ margin: 0 }}>
            <Calendar size={16} />
            <input
              type="date"
              value={dateFrom}
              onChange={e => {
                setDateFrom(e.target.value);
                setSelectedPeriod('custom');
              }}
              title="Fecha inicial"
            />
            <span>hasta</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => {
                setDateTo(e.target.value);
                setSelectedPeriod('custom');
              }}
              title="Fecha final"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setSelectedPeriod('30d');
              }}
              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
              title="Restablecer fechas"
            >
              Limpiar
            </button>
          )}
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
            <h3>
              <TrendingUp size={18} color="var(--accent)" /> Tendencia de Ventas — <span style={{ color: 'var(--accent)' }}>{currentPeriodLabel}</span>
            </h3>
          </div>
          <DailySalesChart
            sales={sales}
            selectedPeriod={selectedPeriod}
            dateFrom={dateFrom}
            dateTo={dateTo}
            periodLabel={currentPeriodLabel}
          />
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
            <p className="empty-msg">Todo el inventario está en niveles óptimos</p>
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
                          {p.subcategory}{' '}
                          {isShoeCategory(p.category, categories) && p.sizesStock
                            ? `· ${Object.entries(p.sizesStock).filter(([, q]) => q > 0).map(([sz, q]) => `T${sz}(${q})`).join(' ')}`
                            : ''}
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
            <h3><Clock size={18} color="var(--accent)" /> Últimas Ventas ({currentPeriodLabel})</h3>
            <button className="link-btn" onClick={() => onNavigate('sales')}>
              Ver Historial
            </button>
          </div>
          {recentSales.length === 0 ? (
            <p className="empty-msg">No se han registrado ventas en este periodo</p>
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
                <span className="cat-icon-badge" style={{ display: 'inline-flex', padding: 8, background: 'var(--accent-bg)', borderRadius: 8 }}>
                  <Layers size={22} color="var(--accent)" />
                </span>
                <div>
                  <h4>Calzado &amp; Sandalias</h4>
                  <small style={{ color: 'var(--text-muted)' }}>Huaraches, Plataformas, Tacones, Flats con matriz de tallas</small>
                </div>
              </div>
              <div className="cat-stats">
                <div>
                  <span>{shoeProducts.length}</span>
                  <small>Modelos</small>
                </div>
                <div>
                  <span>{shoeProducts.reduce((s, p) => s + (Number(p.stock) || 0), 0)}</span>
                  <small>Pares en Stock</small>
                </div>
                <div>
                  <span>
                    {formatCurrency(
                      shoeProducts.reduce((s, p) => s + (Number(p.stock) || 0) * (Number(p.salePrice) || 0), 0)
                    )}
                  </span>
                  <small>Valor Comercial (C$)</small>
                </div>
              </div>
            </div>

            <div className="category-block">
              <div className="cat-header">
                <span className="cat-icon-badge" style={{ display: 'inline-flex', padding: 8, background: 'rgba(192, 132, 252, 0.12)', borderRadius: 8 }}>
                  <Sparkles size={22} color="#c084fc" />
                </span>
                <div>
                  <h4>Joyería &amp; Accesorios</h4>
                  <small style={{ color: 'var(--text-muted)' }}>Collares, Aretes, Pulseras, Anillos</small>
                </div>
              </div>
              <div className="cat-stats">
                <div>
                  <span>{jewelryProducts.length}</span>
                  <small>Modelos</small>
                </div>
                <div>
                  <span>{jewelryProducts.reduce((s, p) => s + (Number(p.stock) || 0), 0)}</span>
                  <small>Pzas en Stock</small>
                </div>
                <div>
                  <span>
                    {formatCurrency(
                      jewelryProducts.reduce((s, p) => s + (Number(p.stock) || 0) * (Number(p.salePrice) || 0), 0)
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
