import { useMemo } from 'react';
import {
  TrendingUp, DollarSign, Package, ShoppingBag,
  Award, PieChart, Percent, Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/format';
import { PaymentMethodsBar } from './InteractiveCharts';

export default function Reports() {
  const { products, sales, exportSalesCSV } = useApp();

  const completedSales = useMemo(() => sales.filter(s => s.status === 'completed'), [sales]);

  // Total ingresos históricos y costos
  const { totalRevenue, totalCost, totalProfit, totalItemsSold } = useMemo(() => {
    let rev = 0;
    let cost = 0;
    let itemsCount = 0;

    completedSales.forEach(s => {
      rev += Number(s.total) || 0;
      (s.items || []).forEach(it => {
        itemsCount += Number(it.quantity) || 1;
        const prod = products.find(p => p.id === it.productId);
        const unitCost = Number(it.costPrice) || (prod ? Number(prod.costPrice) : Number(it.price) * 0.5);
        cost += unitCost * (Number(it.quantity) || 1);
      });
    });

    return {
      totalRevenue: rev,
      totalCost: cost,
      totalProfit: Math.max(0, rev - cost),
      totalItemsSold: itemsCount,
    };
  }, [completedSales, products]);

  // Ranking de los más vendidos
  const topProducts = useMemo(() => {
    const map = {};
    completedSales.forEach(s => {
      (s.items || []).forEach(it => {
        if (!map[it.productCode]) {
          map[it.productCode] = {
            code: it.productCode,
            name: it.productName,
            units: 0,
            revenue: 0,
          };
        }
        map[it.productCode].units += Number(it.quantity) || 1;
        map[it.productCode].revenue += Number(it.subtotal) || Number(it.price) * (Number(it.quantity) || 1);
      });
    });

    return Object.values(map)
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [completedSales]);

  // Desglose por método de pago
  const paymentBreakdown = useMemo(() => {
    const counts = { Efectivo: 0, Tarjeta: 0, Transferencia: 0 };
    completedSales.forEach(s => {
      if (counts[s.paymentMethod] !== undefined) {
        counts[s.paymentMethod] += Number(s.total) || 0;
      }
    });
    return counts;
  }, [completedSales]);

  // Desglose por categoría (Zapatos vs Joyas)
  const categoryBreakdown = useMemo(() => {
    let zapUnits = 0, zapRev = 0;
    let joyUnits = 0, joyRev = 0;

    completedSales.forEach(s => {
      (s.items || []).forEach(it => {
        const isZap = it.productCode.includes('ZAP');
        const itSub = Number(it.subtotal) || Number(it.price) * (Number(it.quantity) || 1);
        if (isZap) {
          zapUnits += Number(it.quantity) || 1;
          zapRev += itSub;
        } else {
          joyUnits += Number(it.quantity) || 1;
          joyRev += itSub;
        }
      });
    });

    const totalRevCat = zapRev + joyRev || 1;
    return {
      zapatos: { units: zapUnits, revenue: zapRev, pct: Math.round((zapRev / totalRevCat) * 100) },
      joyas: { units: joyUnits, revenue: joyRev, pct: Math.round((joyRev / totalRevCat) * 100) },
    };
  }, [completedSales]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Reportes &amp; Finanzas</h1>
          <p>Métricas financieras, rentabilidad y ventas en Córdobas (C$)</p>
        </div>
        <div>
          <button className="btn btn-ghost" onClick={exportSalesCSV}>
            <Download size={18} /> Exportar Reporte CSV (C$)
          </button>
        </div>
      </div>

      {/* Tarjetas de Rentabilidad */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <DollarSign size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{formatCurrency(totalRevenue)}</span>
            <span className="kpi-label">Ingresos Totales (C$)</span>
            <span className="kpi-sub">{completedSales.length} ventas completadas</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent)' }}>
            <TrendingUp size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{formatCurrency(totalProfit)}</span>
            <span className="kpi-label">Ganancia Bruta Estimada</span>
            <span className="kpi-sub">Costo mercancía: {formatCurrency(totalCost)}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa' }}>
            <Percent size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-value">
              {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
            </span>
            <span className="kpi-label">Margen de Rentabilidad</span>
            <span className="kpi-sub">Retorno neto sobre venta</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
            <ShoppingBag size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{totalItemsSold} pzas</span>
            <span className="kpi-label">Piezas Vendidas</span>
            <span className="kpi-sub">
              Ticket promedio: {formatCurrency(completedSales.length ? totalRevenue / completedSales.length : 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Top 5 Más Vendidos */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3><Award size={18} color="var(--accent)" /> Top 5 Productos Más Vendidos</h3>
          </div>
          {topProducts.length === 0 ? (
            <p className="empty-msg">No hay datos suficientes de ventas</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ranking</th>
                    <th>Producto</th>
                    <th>Vendidos</th>
                    <th style={{ textAlign: 'right' }}>Ingresos (C$)</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, idx) => (
                    <tr key={p.code}>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background:
                              idx === 0
                                ? 'var(--accent)'
                                : idx === 1
                                ? '#94a3b8'
                                : idx === 2
                                ? '#b45309'
                                : 'rgba(255,255,255,0.08)',
                            color: '#0f172a',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td>
                        <strong>{p.name}</strong>
                        <small style={{ display: 'block', color: 'var(--text-muted)' }}>{p.code}</small>
                      </td>
                      <td><strong>{p.units}</strong> pzas</td>
                      <td style={{ color: 'var(--accent-light)', fontWeight: 700, textAlign: 'right' }}>
                        {formatCurrency(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ventas por Categoría y Métodos de Pago */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3><PieChart size={18} color="var(--info)" /> Participación por Categoría</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '10px 0' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>👡 Calzado: <strong>{categoryBreakdown.zapatos.units} pzas</strong></span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(categoryBreakdown.zapatos.revenue)} ({categoryBreakdown.zapatos.pct}%)</span>
              </div>
              <div style={{ width: '100%', height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${categoryBreakdown.zapatos.pct}%`, height: '100%', background: 'var(--info)', borderRadius: 6 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>💎 Joyería: <strong>{categoryBreakdown.joyas.units} pzas</strong></span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(categoryBreakdown.joyas.revenue)} ({categoryBreakdown.joyas.pct}%)</span>
              </div>
              <div style={{ width: '100%', height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${categoryBreakdown.joyas.pct}%`, height: '100%', background: '#a78bfa', borderRadius: 6 }} />
              </div>
            </div>

            {/* GRÁFICA INTERACTIVA DE FORMAS DE PAGO */}
            <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: 10, color: 'var(--text-secondary)' }}>
                Distribución por Método de Pago (C$)
              </h4>
              <PaymentMethodsBar breakdown={paymentBreakdown} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
