import { useState, useMemo } from 'react';
import {
  TrendingUp, DollarSign, Package, ShoppingBag,
  Award, PieChart, Percent, Download, Calendar,
  ArrowDownRight, Receipt, Truck, Banknote, Plus, Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTime } from '../utils/format';
import { PaymentMethodsBar } from './InteractiveCharts';
import CashRegisterModal from './CashRegisterModal';

const PERIOD_OPTIONS = [
  { id: 'today', label: 'Hoy', days: 1 },
  { id: '7d', label: '7 Días', days: 7 },
  { id: '15d', label: '15 Días', days: 15 },
  { id: '30d', label: '30 Días', days: 30 },
  { id: 'all', label: 'Todo el Historial', days: null },
];

export default function Reports() {
  const {
    products,
    sales,
    categories,
    cashMovements,
    purchases,
    exportSalesCSV,
    isShoeCategory,
    getCategoryInfo,
  } = useApp();

  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('all'); // 'all' | 'operativos' | 'compras'
  const [showCashModal, setShowCashModal] = useState(false);

  // Función auxiliar para verificar si una fecha entra en el periodo seleccionado o rango personalizado
  const isWithinPeriod = (dateValue) => {
    if (!dateValue) return false;

    // Si hay fechas personalizadas definidas o se seleccionó 'custom'
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

  const completedSales = useMemo(
    () => (sales || []).filter(s => s.status === 'completed' && isWithinPeriod(s.date)),
    [sales, selectedPeriod, dateFrom, dateTo]
  );

  // Total ingresos y costos en el periodo seleccionado
  const { totalRevenue, totalCost, totalProfit, totalItemsSold, totalWholesaleDiscounts } = useMemo(() => {
    let rev = 0;
    let cost = 0;
    let itemsCount = 0;
    let wholesaleDisc = 0;

    completedSales.forEach(s => {
      rev += Number(s.total) || 0;
      wholesaleDisc += Number(s.wholesaleDiscount) || 0;
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
      totalWholesaleDiscounts: wholesaleDisc,
    };
  }, [completedSales, products]);

  // Gastos operativos de caja y compras de mercancía en el periodo seleccionado
  const expensesData = useMemo(() => {
    // 1. Movimientos de salida de caja (excluyendo los generados automáticamente por compras para no duplicar con compras)
    const operatingMovements = (cashMovements || []).filter(
      m =>
        (m.type === 'salida' || m.type === 'egreso') &&
        m.category !== 'Compra de Mercancía' &&
        isWithinPeriod(m.date)
    );

    // 2. Compras de mercancía recibidas en el periodo
    const periodPurchases = (purchases || []).filter(
      p => p.status === 'received' && isWithinPeriod(p.date)
    );

    const totalOperatingExpenses = operatingMovements.reduce(
      (acc, m) => acc + (Number(m.amount) || 0),
      0
    );
    const totalMerchandisePurchases = periodPurchases.reduce(
      (acc, p) => acc + (Number(p.total) || 0),
      0
    );
    const totalAllOutflows = totalOperatingExpenses + totalMerchandisePurchases;

    // Clasificación por categoría de gasto
    const byCategoryMap = {};

    operatingMovements.forEach(m => {
      const cat = m.category || 'Otro Gasto Operativo';
      if (!byCategoryMap[cat]) {
        byCategoryMap[cat] = { category: cat, type: 'operativo', amount: 0, count: 0 };
      }
      byCategoryMap[cat].amount += Number(m.amount) || 0;
      byCategoryMap[cat].count += 1;
    });

    if (periodPurchases.length > 0) {
      const cat = 'Compra de Mercancía (Inventario)';
      byCategoryMap[cat] = {
        category: cat,
        type: 'compras',
        amount: totalMerchandisePurchases,
        count: periodPurchases.length,
      };
    }

    const classifiedCategories = Object.values(byCategoryMap).sort((a, b) => b.amount - a.amount);

    // Lista unificada de registros de gastos para la tabla detallada
    const unifiedList = [
      ...operatingMovements.map(m => ({
        id: `mov-${m.id}`,
        date: m.date,
        category: m.category || 'Gasto Operativo',
        concept: m.description || m.category,
        paymentMethod: 'Efectivo de Caja',
        amount: Number(m.amount) || 0,
        originType: 'operativos',
      })),
      ...periodPurchases.map(p => ({
        id: `pur-${p.id}`,
        date: p.date,
        category: 'Compra de Mercancía',
        concept: `${p.purchaseNumber} · ${p.supplierName || 'Proveedor'} (Fac: ${p.invoiceNumber || 'S/N'})`,
        paymentMethod: p.paymentMethod || 'Transferencia',
        amount: Number(p.total) || 0,
        originType: 'compras',
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      totalOperatingExpenses,
      totalMerchandisePurchases,
      totalAllOutflows,
      netOperatingProfit: totalProfit - totalOperatingExpenses,
      classifiedCategories,
      unifiedList,
      operatingCount: operatingMovements.length,
      purchasesCount: periodPurchases.length,
    };
  }, [cashMovements, purchases, selectedPeriod, dateFrom, dateTo, totalProfit]);

  const filteredExpenseList = useMemo(() => {
    if (expenseTypeFilter === 'all') return expensesData.unifiedList;
    return expensesData.unifiedList.filter(e => e.originType === expenseTypeFilter);
  }, [expensesData.unifiedList, expenseTypeFilter]);

  // Ranking de los más vendidos en el periodo
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

  // Desglose por método de pago en el periodo
  const paymentBreakdown = useMemo(() => {
    const counts = { Efectivo: 0, Tarjeta: 0, Transferencia: 0 };
    completedSales.forEach(s => {
      if (counts[s.paymentMethod] !== undefined) {
        counts[s.paymentMethod] += Number(s.total) || 0;
      }
    });
    return counts;
  }, [completedSales]);

  // Desglose por categoría (Calzado vs Joyería y por cada categoría creada)
  const categoryBreakdown = useMemo(() => {
    let zapUnits = 0, zapRev = 0;
    let joyUnits = 0, joyRev = 0;

    completedSales.forEach(s => {
      (s.items || []).forEach(it => {
        const prod = products.find(p => p.id === it.productId);
        const isZap = prod
          ? isShoeCategory(prod.category, categories)
          : String(it.productCode || '').includes('ZAP') || Boolean(it.size);
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
  }, [completedSales, products, categories, isShoeCategory]);

  const currentPeriodLabel = useMemo(() => {
    if (dateFrom || dateTo) {
      if (dateFrom && dateTo) return `${dateFrom} al ${dateTo}`;
      if (dateFrom) return `Desde ${dateFrom}`;
      return `Hasta ${dateTo}`;
    }
    return PERIOD_OPTIONS.find(o => o.id === selectedPeriod)?.label || 'Periodo Personalizado';
  }, [selectedPeriod, dateFrom, dateTo]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Reportes &amp; Finanzas</h1>
          <p>
            Métricas financieras, rentabilidad y gastos clasificados en Córdobas (C$) —{' '}
            <strong style={{ color: 'var(--accent)' }}>Vista: {currentPeriodLabel}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => setShowCashModal(true)}>
            <Plus size={16} /> Registrar Gasto / Caja
          </button>
          <button className="btn btn-ghost" onClick={exportSalesCSV}>
            <Download size={18} /> Exportar Reporte CSV (C$)
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

      {/* Tarjetas de Rentabilidad de Ventas */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <DollarSign size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{formatCurrency(totalRevenue)}</span>
            <span className="kpi-label">Ingresos por Ventas ({currentPeriodLabel})</span>
            <span className="kpi-sub">{completedSales.length} ventas completadas</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent)' }}>
            <TrendingUp size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{formatCurrency(totalProfit)}</span>
            <span className="kpi-label">Ganancia Bruta en Ventas</span>
            <span className="kpi-sub">Costo mercancía vendida: {formatCurrency(totalCost)}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)' }}>
            <ArrowDownRight size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{formatCurrency(expensesData.totalOperatingExpenses)}</span>
            <span className="kpi-label">Gastos Operativos ({currentPeriodLabel})</span>
            <span className="kpi-sub">
              Utilidad Neta: <strong style={{ color: expensesData.netOperatingProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(expensesData.netOperatingProfit)}</strong>
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
            <ShoppingBag size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{totalItemsSold} pzas</span>
            <span className="kpi-label">Piezas Vendidas ({currentPeriodLabel})</span>
            <span className="kpi-sub">
              Margen bruto: {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}% · Ticket prom: {formatCurrency(completedSales.length ? totalRevenue / completedSales.length : 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Top 5 Más Vendidos */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3><Award size={18} color="var(--accent)" /> Top 5 Productos Más Vendidos ({currentPeriodLabel})</h3>
          </div>
          {topProducts.length === 0 ? (
            <p className="empty-msg">No hay ventas registradas en este periodo ({currentPeriodLabel})</p>
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
            <h3><PieChart size={18} color="var(--info)" /> Participación por Categoría ({currentPeriodLabel})</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '10px 0' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>Calzado &amp; Sandalias: <strong>{categoryBreakdown.zapatos.units} pzas</strong></span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(categoryBreakdown.zapatos.revenue)} ({categoryBreakdown.zapatos.pct}%)</span>
              </div>
              <div style={{ width: '100%', height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${categoryBreakdown.zapatos.pct}%`, height: '100%', background: 'var(--info)', borderRadius: 6 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>Joyería &amp; Accesorios: <strong>{categoryBreakdown.joyas.units} pzas</strong></span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(categoryBreakdown.joyas.revenue)} ({categoryBreakdown.joyas.pct}%)</span>
              </div>
              <div style={{ width: '100%', height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${categoryBreakdown.joyas.pct}%`, height: '100%', background: '#a78bfa', borderRadius: 6 }} />
              </div>
            </div>

            {/* GRÁFICA INTERACTIVA DE FORMAS DE PAGO */}
            <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: 10, color: 'var(--text-secondary)' }}>
                Distribución por Método de Pago ({currentPeriodLabel})
              </h4>
              <PaymentMethodsBar breakdown={paymentBreakdown} />
            </div>
          </div>
        </div>
      </div>

      {/* APARTADO DE GASTOS Y EGRESOS CLASIFICADOS */}
      <div className="dash-card" style={{ marginTop: 22 }}>
        <div
          className="dash-card-header"
          style={{ flexWrap: 'wrap', gap: 12 }}
        >
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Receipt size={19} color="var(--danger)" /> Apartado de Gastos &amp; Egresos Clasificados ({currentPeriodLabel})
            </h3>
            <small style={{ color: 'var(--text-muted)' }}>
              Control detallado de gastos operativos de tienda y compras de mercancía en el periodo seleccionado
            </small>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `Todos (${expensesData.unifiedList.length})` },
              { id: 'operativos', label: `Gastos Operativos (${expensesData.operatingCount})` },
              { id: 'compras', label: `Compras Mercancía (${expensesData.purchasesCount})` },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setExpenseTypeFilter(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: '0.78rem',
                  fontWeight: expenseTypeFilter === tab.id ? 700 : 500,
                  background: expenseTypeFilter === tab.id ? 'rgba(239, 68, 68, 0.16)' : 'var(--bg-primary)',
                  color: expenseTypeFilter === tab.id ? '#fca5a5' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resumen rápido de Gastos del Periodo */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
            }}
          >
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'block' }}>
              Gastos Operativos / Caja ({currentPeriodLabel})
            </span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--danger)' }}>
              {formatCurrency(expensesData.totalOperatingExpenses)}
            </strong>
            <small style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {expensesData.operatingCount} salida(s) registrada(s)
            </small>
          </div>

          <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'block' }}>
              Inversión en Compras de Mercancía ({currentPeriodLabel})
            </span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>
              {formatCurrency(expensesData.totalMerchandisePurchases)}
            </strong>
            <small style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {expensesData.purchasesCount} factura(s) de proveedor
            </small>
          </div>

          <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
            }}
          >
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'block' }}>
              Total Salidas &amp; Compras ({currentPeriodLabel})
            </span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--info)' }}>
              {formatCurrency(expensesData.totalAllOutflows)}
            </strong>
            <small style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Suma de gastos operativos + compras
            </small>
          </div>
        </div>

        {/* Clasificación por Categoría de Gasto + Historial Detallado */}
        <div className="dashboard-grid" style={{ marginTop: 10 }}>
          {/* Columna 1: Clasificación por Categoría */}
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 16,
            }}
          >
            <h4 style={{ fontSize: '0.92rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={16} color="var(--accent)" /> Gastos Clasificados por Categoría
            </h4>

            {expensesData.classifiedCategories.length === 0 ? (
              <p className="empty-msg" style={{ padding: '20px 0' }}>
                No hay gastos ni compras registrados en este periodo ({currentPeriodLabel}).
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {expensesData.classifiedCategories.map(cat => {
                  const pct =
                    expensesData.totalAllOutflows > 0
                      ? Math.round((cat.amount / expensesData.totalAllOutflows) * 100)
                      : 0;
                  return (
                    <div key={cat.category}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: 4 }}>
                        <span>
                          <strong>{cat.category}</strong>{' '}
                          <small style={{ color: 'var(--text-muted)' }}>({cat.count} reg.)</small>
                        </span>
                        <span style={{ fontWeight: 700, color: cat.type === 'compras' ? 'var(--accent)' : 'var(--danger)' }}>
                          {formatCurrency(cat.amount)} ({pct}%)
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: 8,
                          background: 'rgba(255,255,255,0.07)',
                          borderRadius: 6,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.max(3, pct)}%`,
                            height: '100%',
                            background: cat.type === 'compras' ? 'var(--accent)' : 'var(--danger)',
                            borderRadius: 6,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Columna 2: Tabla Detallada de Gastos */}
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 16,
            }}
          >
            <h4 style={{ fontSize: '0.92rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Banknote size={16} color="var(--danger)" /> Detalle de Movimientos de Gasto ({filteredExpenseList.length})
            </h4>

            {filteredExpenseList.length === 0 ? (
              <p className="empty-msg" style={{ padding: '20px 0' }}>
                No se encontraron egresos para este filtro en {currentPeriodLabel}.
              </p>
            ) : (
              <div className="table-wrapper" style={{ maxHeight: 280, overflowY: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Categoría</th>
                      <th>Descripción / Concepto</th>
                      <th style={{ textAlign: 'right' }}>Monto (C$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenseList.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {formatDateTime(item.date)}
                        </td>
                        <td>
                          <span
                            className={`badge ${item.originType === 'compras' ? 'badge-warning' : 'badge-danger'}`}
                            style={{ fontSize: '0.72rem' }}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>
                          <div>{item.concept}</div>
                          <small style={{ color: 'var(--text-muted)' }}>{item.paymentMethod}</small>
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 700,
                            color: item.originType === 'compras' ? 'var(--accent)' : 'var(--danger)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          -{formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCashModal && <CashRegisterModal onClose={() => setShowCashModal(false)} />}
    </div>
  );
}
