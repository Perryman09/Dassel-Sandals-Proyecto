import { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/format';

/**
 * Gráfica Interactiva de Ventas sincronizada con el selector de periodo del Dashboard:
 * Muestra el comportamiento y tendencia de ventas según el periodo o rango de fechas seleccionado.
 */
export function DailySalesChart({
  sales,
  selectedPeriod = '30d',
  dateFrom = '',
  dateTo = '',
  periodLabel = '',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const completedSales = useMemo(
    () => (sales || []).filter(s => s.status === 'completed'),
    [sales]
  );

  // Construir los bloques de datos según el periodo seleccionado arriba
  const chartData = useMemo(() => {
    const now = new Date();
    const buckets = [];
    const isCustom = selectedPeriod === 'custom' || Boolean(dateFrom || dateTo);

    if (isCustom) {
      let start, end;
      if (dateFrom && dateTo) {
        start = new Date(`${dateFrom}T00:00:00`);
        end = new Date(`${dateTo}T23:59:59`);
      } else if (dateFrom) {
        start = new Date(`${dateFrom}T00:00:00`);
        end = new Date();
      } else {
        end = new Date(`${dateTo}T23:59:59`);
        start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 29, 0, 0, 0);
      }

      if (start > end) {
        const tmp = start;
        start = end;
        end = tmp;
      }

      const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

      if (diffDays <= 1) {
        const dayStr = start.toISOString().split('T')[0];
        const intervals = [
          { startH: 8, endH: 10, label: '8-10am' },
          { startH: 10, endH: 12, label: '10-12m' },
          { startH: 12, endH: 14, label: '12-2pm' },
          { startH: 14, endH: 16, label: '2-4pm' },
          { startH: 16, endH: 18, label: '4-6pm' },
          { startH: 18, endH: 20, label: '6-8pm' },
          { startH: 20, endH: 24, label: '8pm+' },
        ];

        intervals.forEach(inv => {
          const matching = completedSales.filter(s => {
            const sdStr = String(s.date).split('T')[0];
            if (sdStr !== dayStr) return false;
            const d = new Date(s.date);
            const h = d.getHours();
            return h >= inv.startH && h < inv.endH;
          });
          const total = matching.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
          buckets.push({
            key: `hour-${inv.label}`,
            label: inv.label,
            fullLabel: `Horario ${inv.label} (${dayStr})`,
            total,
            count: matching.length,
          });
        });
      } else if (diffDays <= 31) {
        const cur = new Date(start);
        cur.setHours(0, 0, 0, 0);
        const endLimit = new Date(end);
        endLimit.setHours(23, 59, 59, 999);

        while (cur <= endLimit && buckets.length < 32) {
          const yyyy = cur.getFullYear();
          const mm = String(cur.getMonth() + 1).padStart(2, '0');
          const dd = String(cur.getDate()).padStart(2, '0');
          const dateStr = `${yyyy}-${mm}-${dd}`;

          const shortLabel = diffDays > 16
            ? String(cur.getDate())
            : `${cur.getDate()} ${cur.toLocaleDateString('es-NI', { month: 'short' }).replace('.', '')}`;

          const fullLabel = cur.toLocaleDateString('es-NI', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
          });

          const matching = completedSales.filter(s => String(s.date).startsWith(dateStr));
          const total = matching.reduce((acc, s) => acc + (Number(s.total) || 0), 0);

          buckets.push({
            key: dateStr,
            label: shortLabel,
            fullLabel,
            total,
            count: matching.length,
          });

          cur.setDate(cur.getDate() + 1);
        }
      } else if (diffDays <= 90) {
        const cur = new Date(start);
        cur.setHours(0, 0, 0, 0);
        let blockIndex = 1;

        while (cur <= end && buckets.length < 16) {
          const blockEnd = new Date(cur.getTime() + 6 * 24 * 60 * 60 * 1000);
          blockEnd.setHours(23, 59, 59, 999);
          const effectiveEnd = blockEnd > end ? end : blockEnd;

          const startLabel = cur.toLocaleDateString('es-NI', { day: 'numeric', month: 'short' });
          const endLabel = effectiveEnd.toLocaleDateString('es-NI', { day: 'numeric', month: 'short' });
          const label = `${cur.getDate()}-${effectiveEnd.getDate()}`;
          const fullLabel = `Semana del ${startLabel} al ${endLabel}`;

          const matching = completedSales.filter(s => {
            const sd = new Date(s.date);
            return sd >= cur && sd <= effectiveEnd;
          });
          const total = matching.reduce((acc, s) => acc + (Number(s.total) || 0), 0);

          buckets.push({
            key: `custom-week-${blockIndex++}`,
            label,
            fullLabel,
            total,
            count: matching.length,
          });

          cur.setDate(cur.getDate() + 7);
        }
      } else {
        const cur = new Date(start.getFullYear(), start.getMonth(), 1);
        while (cur <= end && buckets.length < 24) {
          const yr = cur.getFullYear();
          const mo = cur.getMonth();
          const label = cur.toLocaleDateString('es-NI', { month: 'short', year: '2-digit' });
          const fullLabel = cur.toLocaleDateString('es-NI', { month: 'long', year: 'numeric' });

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

          cur.setMonth(cur.getMonth() + 1);
        }
      }

      return buckets;
    }

    // Periodos predeterminados: 'today' | '7d' | '15d' | '30d' | 'all'
    if (selectedPeriod === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      const intervals = [
        { startH: 8, endH: 10, label: '8-10am' },
        { startH: 10, endH: 12, label: '10-12m' },
        { startH: 12, endH: 14, label: '12-2pm' },
        { startH: 14, endH: 16, label: '2-4pm' },
        { startH: 16, endH: 18, label: '4-6pm' },
        { startH: 18, endH: 20, label: '6-8pm' },
        { startH: 20, endH: 24, label: '8pm+' },
      ];

      intervals.forEach(inv => {
        const matching = completedSales.filter(s => {
          const dStr = String(s.date).split('T')[0];
          if (dStr !== todayStr) {
            const d = new Date(s.date);
            if (
              d.getFullYear() !== now.getFullYear() ||
              d.getMonth() !== now.getMonth() ||
              d.getDate() !== now.getDate()
            ) {
              return false;
            }
          }
          const d = new Date(s.date);
          const h = d.getHours();
          return h >= inv.startH && h < inv.endH;
        });

        const total = matching.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
        buckets.push({
          key: `today-${inv.label}`,
          label: inv.label,
          fullLabel: `Hoy: ${inv.label}`,
          total,
          count: matching.length,
        });
      });
    } else if (selectedPeriod === '7d') {
      // 7 días
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const label = i === 0 ? 'Hoy' : d.toLocaleDateString('es-NI', { weekday: 'short', day: 'numeric' });
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
    } else if (selectedPeriod === '15d') {
      // 15 días
      for (let i = 14; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const label = i === 0 ? 'Hoy' : `${d.getDate()} ${d.toLocaleDateString('es-NI', { month: 'short' }).replace('.', '')}`;
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
    } else if (selectedPeriod === '30d') {
      // 30 días
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const label = i === 0 ? 'Hoy' : String(d.getDate());
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
    } else if (selectedPeriod === 'all') {
      // Todo el historial (últimos 6 meses)
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
  }, [completedSales, selectedPeriod, dateFrom, dateTo]);

  const maxTotal = Math.max(...chartData.map(d => d.total), 1000);
  const currentBucket = chartData[chartData.length - 1] || { total: 0, count: 0, fullLabel: '', label: 'N/A' };
  const periodSum = chartData.reduce((acc, d) => acc + d.total, 0);
  const periodCount = chartData.reduce((acc, d) => acc + d.count, 0);
  const bestBucket = chartData.reduce(
    (best, d) => (d.total > best.total ? d : best),
    chartData[0] || { label: '-', total: 0 }
  );

  return (
    <div className="interactive-chart-box">
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
            Último Tramo ({currentBucket.label || 'N/A'})
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
            Total ({periodLabel || 'Periodo'})
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
            const count = chartData.length || 1;
            const slotWidth = 620 / count;
            const barWidth = Math.max(8, Math.min(48, slotWidth * (count > 20 ? 0.65 : 0.55)));
            const x = 50 + idx * slotWidth + (slotWidth - barWidth) / 2;
            const barH = Math.max(6, (d.total / maxTotal) * 100);
            const y = 140 - barH;
            const isHovered = hoveredIdx === idx;

            // En series largas (ej. 30 días), alternar etiquetas para mantener legibilidad
            const isLast = idx === count - 1;
            const showLabel = count <= 16 || idx % (count > 24 ? 3 : 2) === 0 || isLast;

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
                {(isHovered || (d.total > 0 && count <= 15)) && d.total > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={Math.max(22, y - 6)}
                    textAnchor="middle"
                    fill={isHovered ? 'var(--accent-light)' : 'var(--text-secondary)'}
                    fontSize={count > 15 ? '9' : '10'}
                    fontWeight="600"
                  >
                    {d.total >= 1000 ? `C$${(d.total / 1000).toFixed(1)}k` : `C$${Math.round(d.total)}`}
                  </text>
                )}

                {/* Etiqueta inferior del periodo */}
                {(showLabel || isHovered) && (
                  <text
                    x={x + barWidth / 2}
                    y="164"
                    textAnchor="middle"
                    fill={isHovered ? 'var(--text-primary)' : 'var(--text-muted)'}
                    fontSize={count > 20 ? '8.5' : count > 12 ? '10' : '11.5'}
                    fontWeight={isHovered ? '700' : '500'}
                  >
                    {d.label}
                  </text>
                )}
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
            <strong>Calzado ({zapPct}%)</strong>
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
            <strong>Joyas ({joyPct}%)</strong>
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
    { label: 'Efectivo', val: Number(breakdown.Efectivo || 0), color: 'var(--success)' },
    { label: 'Tarjeta', val: Number(breakdown.Tarjeta || 0), color: 'var(--info)' },
    { label: 'Transferencia', val: Number(breakdown.Transferencia || 0), color: 'var(--accent)' },
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
