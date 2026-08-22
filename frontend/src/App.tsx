import { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import ReconciliationView from './components/ReconciliationView';
import TransactionsView from './components/TransactionsView';
import CashPositionView from './components/CashPositionView';
import ForecastView from './components/ForecastView';
import SettlementQAView from './components/SettlementQAView';
import type { ViewType } from './types';

export default function App() {
  const [view, setView] = useState<ViewType>('dashboard');

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <DashboardView onNavigate={(v) => setView(v)} />;
      case 'reconciliation':
        return <ReconciliationView />;
      case 'transactions':
        return <TransactionsView />;
      case 'cash-position':
        return <CashPositionView />;
      case 'forecast':
        return <ForecastView />;
      case 'settlement-qa':
        return <SettlementQAView />;
      default:
        return <DashboardView onNavigate={(v) => setView(v)} />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar active={view} onNavigate={setView} />
      <main className="flex-1 overflow-y-auto p-6">
        {renderView()}
      </main>
    </div>
  );
}
