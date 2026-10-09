import { useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, FileText,
  BarChart3, Banknote, ChevronLeft, ChevronRight, RotateCcw,
  Palette, Sun, Moon, Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { THEMES } from '../utils/theme';
import CashRegisterModal from './CashRegisterModal';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventario', Icon: Package },
  { id: 'new-sale', label: 'Nueva Venta', Icon: ShoppingCart },
  { id: 'sales', label: 'Historial Ventas', Icon: FileText },
  { id: 'reports', label: 'Reportes & Finanzas', Icon: BarChart3 },
];

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggle }) {
  const {
    resetAllData,
    backendOnline,
    currentTheme,
    changeTheme,
    themeMode,
    toggleThemeMode,
  } = useApp();
  const [showCashModal, setShowCashModal] = useState(false);

  const handleReset = () => {
    if (window.confirm('¿Deseas restablecer todos los datos a los valores iniciales de demostración?')) {
      resetAllData();
      alert('Datos de demostración restablecidos correctamente.');
    }
  };

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!collapsed && (
            <div className="brand">
              <div className="brand-icon">DS</div>
              <div>
                <h1>Dassel</h1>
                <span>Sandals &amp; Joyas</span>
              </div>
            </div>
          )}
          {collapsed && <div className="brand-icon small" title="Dassel Sandals">DS</div>}
          <button className="collapse-btn" onClick={onToggle} title={collapsed ? 'Expandir' : 'Contraer'}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`nav-item ${currentPage === id ? 'active' : ''}`}
              onClick={() => onNavigate(id)}
              title={collapsed ? label : ''}
            >
              <Icon size={20} />
              {!collapsed && <span>{label}</span>}
            </button>
          ))}

          {/* BOTÓN PARA CONTROL DE CAJA Y SALIDAS MENORES */}
          <button
            className="nav-item highlight-cash"
            onClick={() => setShowCashModal(true)}
            title={collapsed ? 'Caja & Gastos' : ''}
            style={{ marginTop: 8 }}
          >
            <Banknote size={20} color="var(--accent-light)" />
            {!collapsed && <span>Caja &amp; Gastos</span>}
          </button>
        </nav>

        {!collapsed ? (
          <div className="sidebar-footer">
            {/* BOTÓN MODO OSCURO / MODO CLARO */}
            <button
              onClick={toggleThemeMode}
              className="theme-mode-toggle-btn"
              title={`Cambiar a modo ${themeMode === 'dark' ? 'claro' : 'oscuro'}`}
            >
              {themeMode === 'dark' ? (
                <>
                  <Sun size={15} color="#fbbf24" />
                  <span>Modo Claro (Día)</span>
                </>
              ) : (
                <>
                  <Moon size={15} color="#6366f1" />
                  <span>Modo Oscuro (Noche)</span>
                </>
              )}
            </button>

            {/* SELECTOR DE COLOR / TEMA DE TODO EL SISTEMA */}
            <div className="theme-picker-box">
              <div className="theme-picker-header">
                <Palette size={14} color="var(--accent)" />
                <span>Color del Sistema</span>
              </div>
              <div className="theme-colors-row">
                {Object.values(THEMES).map(t => (
                  <button
                    key={t.id}
                    className={`theme-dot-btn ${currentTheme === t.id ? 'active' : ''}`}
                    style={{ backgroundColor: t.primary }}
                    title={t.name}
                    onClick={() => changeTheme(t.id)}
                  />
                ))}
              </div>
            </div>

            {/* ESTADO DE CONEXIÓN CON BACKEND NESTJS */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '5px 8px',
                borderRadius: 6,
                background: backendOnline ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                color: backendOnline ? 'var(--success)' : 'var(--warning)',
                fontSize: '0.72rem',
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: backendOnline ? 'var(--success)' : 'var(--warning)',
                  display: 'inline-block',
                }}
              />
              {backendOnline ? 'NestJS + PostgreSQL' : 'Modo Local (Offline)'}
            </div>

            <button
              onClick={handleReset}
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', fontSize: '0.75rem', justifyContent: 'center', marginBottom: 8 }}
              title="Restablecer a datos de ejemplo"
            >
              <RotateCcw size={13} /> Reiniciar datos demo
            </button>
            <p>Dassel Sandals © 2026</p>
            <small style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
              Moneda: Córdobas (C$) · PYME
            </small>
          </div>
        ) : (
          <div style={{ padding: 8, textAlign: 'center' }}>
            <button
              onClick={toggleThemeMode}
              className="icon-btn"
              style={{ margin: '0 auto 8px auto', width: 32, height: 32 }}
              title={`Cambiar a modo ${themeMode === 'dark' ? 'claro' : 'oscuro'}`}
            >
              {themeMode === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#6366f1" />}
            </button>
            <button
              onClick={() => setShowCashModal(true)}
              className="icon-btn"
              style={{ margin: '0 auto 8px auto', width: 32, height: 32 }}
              title="Control de Caja"
            >
              <Banknote size={16} color="var(--accent)" />
            </button>
            <button
              onClick={handleReset}
              className="icon-btn"
              style={{ margin: '0 auto', width: 28, height: 28 }}
              title="Reiniciar datos demo"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        )}
      </aside>

      {/* Modal de Control de Caja */}
      {showCashModal && <CashRegisterModal onClose={() => setShowCashModal(false)} />}
    </>
  );
}
