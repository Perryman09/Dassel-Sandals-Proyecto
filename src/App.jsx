import { useState } from 'react';
import './App.css';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import NewSale from './components/NewSale';
import Sales from './components/Sales';
import Reports from './components/Reports';

function App() {
  const [page, setPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard onNavigate={setPage} />;
      case 'inventory': return <Inventory />;
      case 'new-sale': return <NewSale onNavigate={setPage} />;
      case 'sales': return <Sales />;
      case 'reports': return <Reports />;
      default: return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <AppProvider>
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
    </AppProvider>
  );
}

export default App;
