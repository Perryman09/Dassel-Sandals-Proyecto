import { useState } from 'react';
import { formatCurrency } from '../utils/format';

/**
 * Gráfica Interactiva de Barras / Tendencia Diaria con Tooltip
 */
export function DailySalesChart({ sales }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Agrupar ventas de los últimos 7 días
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('es-NI', { weekday: 'short', day: 'numeric' });

    const daySales = sales.filter(s => s.status === 'completed' && String(s.date).startsWith(dateStr));
    const total = daySales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    const count = daySales.length;

    days.push({ dateStr, dayLabel, total, count });
  }

  const maxTotal = Math.max(...days.map(d => d.total), 1000);
  const chartHeight = 160;

  return (
    <div className="interactive-chart-box">
      <div className="chart-header-mini">
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Ingresos últimos 7 días (Pasa el cursor para ver detalles)
        </span>
      </div>

      <div className="chart-svg-container" style={{ position: 'relative', height: chartHeight + 40 }}>
        {/* Tooltip flotante */}
        {hoveredIdx !== null && (
          <div
            className="chart-tooltip"
            style={{
              left: `${(hoveredIdx / (days.length - 1)) * 80 + 10}%`,
              top: 0,
            }}
          >
            <strong>{days[hoveredIdx].dayLabel}</strong>
            <div>Total: <span style={{ color: 'var(--accent)' }}>{formatCurrency(days[hoveredIdx].total)}</span></div>
            <small>{days[hoveredIdx].count} venta(s)</small>
          </div>
        )}

        <svg viewBox="0 0 700 180" className="chart-svg" style={{ width: '100%', height: '100%' }}>
          {/* Líneas guía de fondo */}
          <line x1="40" y1="30" x2="680" y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
          <line x1="40" y1="80" x2="680" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
          <line x1="40" y1="130" x2="680" y2="130" stroke="rgba(255,255,255,0.08)" />

          {/* Barras interactivas */}
          {days.map((d, idx) => {
            const barWidth = 44;
            const x = 70 + idx * 88;
            const barH = Math.max(6, (d.total / maxTotal) * 100);
            const y = 130 - barH;
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={d.dateStr}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Fondo tenue al hacer hover */}
                {isHovered && (
                  <rect
                    x={x - 8}
                    y="10"
                    width={barWidth + 16}
                    height="130"
                    fill="rgba(255,255,255,0.04)"
                    rx="6"
                  />
                )}

                {/* Barra principal con gradiente */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx="6"
                  fill={isHovered ? 'var(--accent-light)' : 'var(--accent)'}
                  style={{ transition: 'all 0.2s ease' }}
                />

                {/* Etiqueta del día */}
                <text
                  x={x + barWidth / 2}
                  y="155"
                  textAnchor="middle"
                  fill={isHovered ? 'var(--text-primary)' : 'var(--text-muted)'}
                  fontSize="12"
                  fontWeight={isHovered ? '700' : '500'}
                >
                  {d.dayLabel}
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
