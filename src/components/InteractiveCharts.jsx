import { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/format';

/**
 * Panel y Gráfica Interactiva de Ventas por Periodo:
 * Permite seleccionar entre ventas Diarias, Semanales, Quincenales y Mensuales.
 */
export function DailySalesChart({ sales }) {
  const [period, setPeriod] = useState('diarias'); // 'diarias' | 'semanales' | 'quincenales' | 'mensuales'
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const completedSales = useMemo(
    () => (sales || []).filter(s => s.status === 'completed'),
    [sales]
  );

  // Construir los bloques de datos según el periodo seleccionado
  const chartData = useMemo(() => {
    const now = new Date();
    const buckets = [];

    if (period === 'diarias') {
      // Últimos 7 días
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const label =
          i === 0
            ? 'Hoy'
            : d.toLocaleDateString('es-NI', { weekday: 'short', day: 'numeric' });
        const fullLabel = d.toLocaleDateString('es-NI', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
        });

        const matching = completedSales.filter(s => String(s.date).startsWith(dateStr));
        const total = matching.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
        buckets.push({
          key: dateStr,
          label,
          fullLabel,
          total,
          count: matching.length,
        });
      }
    } else if (period === 'semanales') {
      // Últimas 6 semanas (bloques de 7 días terminando hoy)
      for (let i = 5; i >= 0; i--) {
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7);
        end.setHours(23, 59, 59, 999);
        const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6);
        start.setHours(0, 0, 0, 0);

        const startShort = start.toLocaleDateString('es-NI', { day: 'numeric', month: 'short' });
        const endShort = end.toLocaleDateString('es-NI', { day: 'numeric', month: 'short' });
        const label = i === 0 ? 'Esta Sem.' : `${start.getDate()}-${end.getDate()} ${end.toLocaleDateString('es-NI', { month: 'short' })}`;
        const fullLabel = `Semana del ${startShort} al ${endShort}`;

        const matching = completedSales.filter(s => {
          const sd = new Date(s.date);
          return sd >= start && sd <= end;
        });
        const total = matching.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
        buckets.push({
          key: `week-${i}`,
          label,
          fullLabel,
          total,
          count: matching.length,
        });
      }
    } else if (period === 'quincenales') {
      // Últimas 6 quincenas (1ra: 1-15, 2da: 16-fin de mes)
      let year = now.getFullYear();
      let month = now.getMonth();
      let isSecondHalf = now.getDate() >= 16;

      const tempQuincenas = [];
      for (let i = 0; i < 6; i++) {
        const startDay = isSecondHalf ? 16 : 1;
        const endDay = isSecondHalf
          ? new Date(year, month + 1, 0).getDate()
          : 15;

        const start = new Date(year, month, startDay, 0, 0, 0, 0);
        const end = new Date(year, month, endDay, 23, 59, 59, 999);
        const monthShort = start.toLocaleDateString('es-NI', { month: 'short' });
        const qLabel = isSecondHalf ? `2da Q. ${monthShort}` : `1ra Q. ${monthShort}`;
        const fullLabel = `${isSecondHalf ? '2da Quincena' : '1ra Quincena'} de ${start.toLocaleDateString('es-NI', { month: 'long', year: 'numeric' })} (${startDay} al ${endDay})`;

        const matching = completedSales.filter(s => {
          const sd = new Date(s.date);
          return sd >= start && sd <= end;
        });
        const total = matching.reduce((acc, s) => acc + (Number(s.total) || 0), 0);

        tempQuincenas.unshift({
          key: `q-${year}-${month}-${isSecondHalf ? 2 : 1}`,
          label: qLabel,
          fullLabel,
          total,
          count: matching.length,
        });

        if (isSecondHalf) {
          isSecondHalf = false;
        } else {
          isSecondHalf = true;
          month -= 1;
          if (month < 0) {
            month = 11;
            year -= 1;
          }
        }
      }
      buckets.push(...tempQuincenas);
    } else if (period === 'mensuales') {
      // Últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const yr = d.getFullYear();
        const mo = d.getMonth();
        const label = d.toLocaleDateString('es-NI', { month: 'short', year: '2-digit' });
        const fullLabel = d.toLocaleDateString('es-NI', { month: 'long', year: 'numeric' });

        const matching = completedSales.filter(s => {
          const sd = new Date(s.date);
          return sd.getFullYear() === yr && sd.getMonth() === mo;
        });
        const total = matching.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
        buckets.push({
          key: `month-${yr}-${mo}`,
          label,
          fullLabel,
          total,
          count: matching.length,
        });
      }
    }

    return buckets;
  }, [completedSales, period]);

  const maxTotal = Math.max(...chartData.map(d => d.total), 1000);
  const currentBucket = chartData[chartData.length - 1] || { total: 0, count: 0, fullLabel: '' };
  const periodSum = chartData.reduce((acc, d) => acc + d.total, 0);
  const periodCount = chartData.reduce((acc, d) => acc + d.count, 0);
  const bestBucket = chartData.reduce(
    (best, d) => (d.total > best.total ? d : best),
    chartData[0] || { label: '-', total: 0 }
  );

  const periodTitles = {
    diarias: { currentLabel: 'Ventas de Hoy', rangeLabel: 'Últimos 7 días' },
    semanales: { currentLabel: 'Venta Esta Semana', rangeLabel: 'Últimas 6 semanas' },
    quincenales: { currentLabel: 'Venta Quincena Actual', rangeLabel: 'Últimas 6 quincenas' },
    mensuales: { currentLabel: 'Venta Mes Actual', rangeLabel: 'Últimos 6 meses' },
  };

  return (
    <div className="interactive-chart-box">
      {/* Selector de Periodo: Diarias, Semanales, Quincenales, Mensuales */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          Visualizando: <strong style={{ color: 'var(--text-primary)' }}>{periodTitles[period].rangeLabel}</strong> (Pasa el cursor sobre las barras)
        </span>

        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-primary)',
            padding: 4,
            borderRadius: 10,
            border: '1px solid var(--border)',
            gap: 4,
          }}
        >
          {[
            { id: 'diarias', label: 'Diarias' },
            { id: 'semanales', label: 'Semanales' },
            { id: 'quincenales', label: 'Quincenales' },
            { id: 'mensuales', label: 'Mensuales' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setPeriod(tab.id);
                setHoveredIdx(null);
              }}
              style={{
                padding: '5px 12px',
                borderRadius: 7,
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: period === tab.id ? 700 : 500,
                background: period === tab.id ? 'var(--accent)' : 'transparent',
                color: period === tab.id ? '#0f172a' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mini Panel de Resumen del Periodo */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 8,
            padding: '8px 12px',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>
            {periodTitles[period].currentLabel}
          </span>
          <strong style={{ fontSize: '1.05rem', color: 'var(--accent)' }}>
            {formatCurrency(currentBucket.total)}
          </strong>
          <small style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {currentBucket.count} venta(s)
          </small>
        </div>

        <div
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 8,
            padding: '8px 12px',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>
            Acumulado ({periodTitles[period].rangeLabel})
          </span>
          <strong style={{ fontSize: '1.05rem', color: 'var(--info)' }}>
            {formatCurrency(periodSum)}
          </strong>
          <small style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {periodCount} venta(s) totales
          </small>
        </div>

        <div
          style={{
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: 8,
            padding: '8px 12px',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>
            Mejor Registro ({bestBucket.label})
          </span>
          <strong style={{ fontSize: '1.05rem', color: 'var(--success)' }}>
            {formatCurrency(bestBucket.total)}
          </strong>
          <small style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Promedio: {formatCurrency(chartData.length ? periodSum / chartData.length : 0)}
          </small>
        </div>
      </div>

      {/* Gráfica SVG */}
      <div className="chart-svg-container" style={{ position: 'relative', height: 200 }}>
        {hoveredIdx !== null && chartData[hoveredIdx] && (
          <div
            className="chart-tooltip"
            style={{
              left: `${Math.min(82, Math.max(8, (hoveredIdx / Math.max(1, chartData.length - 1)) * 76 + 10))}%`,
              top: 0,
              zIndex: 10,
            }}
          >
            <strong style={{ textTransform: 'capitalize' }}>{chartData[hoveredIdx].fullLabel}</strong>
            <div>
              Total:{' '}
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                {formatCurrency(chartData[hoveredIdx].total)}
              </span>
            </div>
            <small>{chartData[hoveredIdx].count} venta(s) completadas</small>
          </div>
        )}

        <svg viewBox="0 0 700 185" className="chart-svg" style={{ width: '100%', height: '100%' }}>
          {/* Líneas guía de fondo */}
          <line x1="40" y1="30" x2="680" y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
          <line x1="40" y1="85" x2="680" y2="85" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
          <line x1="40" y1="140" x2="680" y2="140" stroke="rgba(255,255,255,0.1)" />

          {chartData.map((d, idx) => {
            const count = chartData.length;
            const slotWidth = 620 / count;
            const barWidth = Math.min(52, slotWidth * 0.55);
            const x = 50 + idx * slotWidth + (slotWidth - barWidth) / 2;
            const barH = Math.max(6, (d.total / maxTotal) * 100);
            const y = 140 - barH;
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={d.key}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {isHovered && (
                  <rect
                    x={x - 8}
                    y="15"
                    width={barWidth + 16}
                    height="130"
                    fill="rgba(255,255,255,0.04)"
                    rx="6"
                  />
                )}

                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx="6"
                  fill={isHovered ? 'var(--accent-light)' : d.total > 0 ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}
                  style={{ transition: 'all 0.2s ease' }}
                />

                {/* Monto resumido encima de la barra */}
                {d.total > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={Math.max(22, y - 6)}
                    textAnchor="middle"
                    fill={isHovered ? 'var(--accent-light)' : 'var(--text-secondary)'}
                    fontSize="10"
                    fontWeight="600"
                  >
                    {d.total >= 1000 ? `C$${(d.total / 1000).toFixed(1)}k` : `C$${Math.round(d.total)}`}
                  </text>
                )}

                {/* Etiqueta inferior del periodo */}
                <text
                  x={x + barWidth / 2}
                  y="164"
                  textAnchor="middle"
                  fill={isHovered ? 'var(--text-primary)' : 'var(--text-muted)'}
                  fontSize="11.5"
                  fontWeight={isHovered ? '700' : '500'}
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/**
 * Gráfica Circular / Donut Interactiva de Categorías (Zapatos vs Joyas)
 */
export function CategoryDonutChart({ zapRevenue, joyRevenue, zapUnits, joyUnits }) {
  const [activeSlice, setActiveSlice] = useState(null);

  const totalRev = Number(zapRevenue) + Number(joyRevenue) || 1;
  const zapPct = Math.round((Number(zapRevenue) / totalRev) * 100);
  const joyPct = 100 - zapPct;

  // Parámetros del donut
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const zapStroke = (zapPct / 100) * circumference;
  const joyStroke = (joyPct / 100) * circumference;

  return (
    <div className="donut-chart-wrapper">
      <div className="donut-svg-box">
        <svg viewBox="0 0 160 160" width="140" height="140">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="24"
          />

          {/* Segmento Zapatos */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="var(--info)"
            strokeWidth={activeSlice === 'zapatos' ? '28' : '24'}
            strokeDasharray={`${zapStroke} ${circumference}`}
            strokeDashoffset="0"
            transform="rotate(-90 80 80)"
            style={{ cursor: 'pointer', transition: 'stroke-width 0.2s ease' }}
            onMouseEnter={() => setActiveSlice('zapatos')}
            onMouseLeave={() => setActiveSlice(null)}
          />

          {/* Segmento Joyas */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#a78bfa"
            strokeWidth={activeSlice === 'joyas' ? '28' : '24'}
            strokeDasharray={`${joyStroke} ${circumference}`}
            strokeDashoffset={-zapStroke}
            transform="rotate(-90 80 80)"
            style={{ cursor: 'pointer', transition: 'stroke-width 0.2s ease' }}
            onMouseEnter={() => setActiveSlice('joyas')}
            onMouseLeave={() => setActiveSlice(null)}
          />

          {/* Texto central */}
          <text x="80" y="75" textAnchor="middle" fill="var(--text-primary)" fontSize="16" fontWeight="bold">
            {activeSlice === 'zapatos' ? `${zapPct}%` : activeSlice === 'joyas' ? `${joyPct}%` : '100%'}
          </text>
          <text x="80" y="93" textAnchor="middle" fill="var(--text-muted)" fontSize="10">
            {activeSlice === 'zapatos' ? 'Calzado' : activeSlice === 'joyas' ? 'Joyas' : 'Ventas'}
          </text>
        </svg>
      </div>

      <div className="donut-legend">
        <div
          className={`legend-item ${activeSlice === 'zapatos' ? 'highlight' : ''}`}
          onMouseEnter={() => setActiveSlice('zapatos')}
          onMouseLeave={() => setActiveSlice(null)}
        >
          <span className="legend-dot" style={{ background: 'var(--info)' }} />
          <div>
            <strong>👡 Calzado ({zapPct}%)</strong>
            <small>{formatCurrency(zapRevenue)} · {zapUnits} pzas</small>
          </div>
        </div>

        <div
          className={`legend-item ${activeSlice === 'joyas' ? 'highlight' : ''}`}
          onMouseEnter={() => setActiveSlice('joyas')}
          onMouseLeave={() => setActiveSlice(null)}
        >
          <span className="legend-dot" style={{ background: '#a78bfa' }} />
          <div>
            <strong>💎 Joyas ({joyPct}%)</strong>
            <small>{formatCurrency(joyRevenue)} · {joyUnits} pzas</small>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Barras horizontales interactivas para Métodos de Pago
 */
export function PaymentMethodsBar({ breakdown }) {
  const total = Number(breakdown.Efectivo || 0) + Number(breakdown.Tarjeta || 0) + Number(breakdown.Transferencia || 0) || 1;

  const items = [
    { label: '💵 Efectivo', val: Number(breakdown.Efectivo || 0), color: 'var(--success)' },
    { label: '💳 Tarjeta', val: Number(breakdown.Tarjeta || 0), color: 'var(--info)' },
    { label: '🏦 Transferencia', val: Number(breakdown.Transferencia || 0), color: 'var(--accent)' },
  ];

  return (
    <div className="payment-bars-container">
      {items.map(it => {
        const pct = Math.round((it.val / total) * 100);
        return (
          <div key={it.label} className="pay-bar-row">
            <div className="pay-bar-labels">
              <span>{it.label}</span>
              <strong>{formatCurrency(it.val)} ({pct}%)</strong>
            </div>
            <div className="pay-bar-track">
              <div
                className="pay-bar-fill"
                style={{ width: `${pct}%`, background: it.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
