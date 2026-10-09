// =========================================================
// DASSEL SANDALS - TEMAS DE COLOR Y MODO OSCURO / CLARO
// =========================================================

export const THEMES = {
  amber: {
    id: 'amber',
    name: 'Dorado Ámbar (Original)',
    emoji: '🌟',
    primary: '#f59e0b',
    hover: '#d97706',
    light: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.35)',
    contrast: '#0f172a',
  },
  rose: {
    id: 'rose',
    name: 'Rosa Coral Boutique',
    emoji: '🌸',
    primary: '#ec4899',
    hover: '#db2777',
    light: '#f472b6',
    bg: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.35)',
    contrast: '#ffffff',
  },
  emerald: {
    id: 'emerald',
    name: 'Verde Esmeralda Fina',
    emoji: '🌿',
    primary: '#10b981',
    hover: '#059669',
    light: '#34d399',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.35)',
    contrast: '#ffffff',
  },
  sapphire: {
    id: 'sapphire',
    name: 'Azul Zafiro Elegante',
    emoji: '💎',
    primary: '#3b82f6',
    hover: '#2563eb',
    light: '#60a5fa',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.35)',
    contrast: '#ffffff',
  },
  amethyst: {
    id: 'amethyst',
    name: 'Púrpura Amatista Joya',
    emoji: '💜',
    primary: '#8b5cf6',
    hover: '#7c3aed',
    light: '#a78bfa',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.35)',
    contrast: '#ffffff',
  },
  terracotta: {
    id: 'terracotta',
    name: 'Terracota Cuero Artesano',
    emoji: '👡',
    primary: '#ea580c',
    hover: '#c2410c',
    light: '#fb923c',
    bg: 'rgba(234, 88, 12, 0.12)',
    border: 'rgba(234, 88, 12, 0.35)',
    contrast: '#ffffff',
  },
};

export const applyTheme = (themeId, mode = 'dark') => {
  const theme = THEMES[themeId] || THEMES.amber;
  const root = document.documentElement;

  // Aplicar modo claro / oscuro
  root.setAttribute('data-theme', mode === 'light' ? 'light' : 'dark');

  // Aplicar colores de acento
  root.style.setProperty('--accent', theme.primary);
  root.style.setProperty('--accent-hover', theme.hover);
  root.style.setProperty('--accent-light', theme.light);
  root.style.setProperty('--accent-bg', theme.bg);
  root.style.setProperty('--accent-border', theme.border);
  root.style.setProperty('--accent-contrast', theme.contrast || '#ffffff');

  try {
    localStorage.setItem('dassel_theme', theme.id);
    localStorage.setItem('dassel_mode', mode);
  } catch (e) {
    console.warn(e);
  }
};
