import { useState } from 'react';
import './App.css';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import NewSale from './components/NewSale';
import Sales from './components/Sales';
import Reports from './components/Reports';
import PurchasesSuppliers from './components/PurchasesSuppliers';
import Login from './components/Login';

function AppContent() {
  const { currentUser } = useApp();
  const [page, setPage] = useState('dashboard');
  const [sidebarHovered, setSidebarHovered] = useState(false);

  // Si no hay sesión activa, muestra la pantalla de inicio de sesión
  if (!currentUser) {
    return <Login />;
  }

  // La barra lateral siempre permanece contraída (72px) por defecto en todo el sistema
  // y se expande de forma flotante al pasar el mouse por encima
  const isSidebarCollapsed = !sidebarHovered;

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard onNavigate={setPage} />;
      case 'inventory': return <Inventory />;
      case 'purchases': return <PurchasesSuppliers onNavigate={setPage} />;
      case 'new-sale': return <NewSale onNavigate={setPage} />;
      case 'sales': return <Sales />;
      case 'reports': return <Reports />;
      default: return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        currentPage={page}
        onNavigate={setPage}
        collapsed={isSidebarCollapsed}
        onHoverChange={setSidebarHovered}
      />
      <main
        className="main-content"
        style={{
          marginLeft: 'var(--sidebar-collapsed)'
        }}
      >
        {renderPage()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
