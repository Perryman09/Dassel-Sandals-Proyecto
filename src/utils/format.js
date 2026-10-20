// =========================================================
// DASSEL SANDALS - UTILIDADES DE FORMATO Y MONEDA (C$)
// =========================================================

/**
 * Formatea cualquier valor numérico a Córdobas Nicaragüenses (C$)
 * Ejemplo: formatCurrency(650) => "C$ 650.00"
 */
export const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `C$ ${num.toLocaleString('es-NI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Formato de fecha y hora local
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-NI', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateOnly = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-NI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const getTodayISO = () => new Date().toISOString().split('T')[0];

export const getCurrentDate = () => new Date();

export const PERIOD_OPTIONS = [
  { id: 'today', label: 'Hoy', days: 1 },
  { id: '7d', label: '7 Días', days: 7 },
  { id: '15d', label: '15 Días', days: 15 },
  { id: '30d', label: '30 Días', days: 30 },
  { id: 'all', label: 'Todo el Historial', days: null },
];

export const isDateWithinPeriod = (dateValue, selectedPeriod, dateFrom = '', dateTo = '') => {
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
