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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Si no hay sesión activa, muestra la pantalla de inicio de sesión
  if (!currentUser) {
    return <Login />;
  }

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
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />
      <main
        className="main-content"
        style={{ marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)' }}
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
