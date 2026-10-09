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
