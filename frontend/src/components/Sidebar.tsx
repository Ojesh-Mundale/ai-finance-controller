import { Zap, LayoutDashboard, RefreshCw, List, TrendingUp, BarChart3, MessageCircle } from 'lucide-react';
import type { ViewType } from '../types';

const navItems: { id: ViewType; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'reconciliation', label: 'Reconciliation', icon: RefreshCw },
  { id: 'transactions', label: 'Transactions', icon: List },
  { id: 'cash-position', label: 'Cash Position', icon: TrendingUp },
  { id: 'forecast', label: 'Forecast', icon: BarChart3 },
  { id: 'settlement-qa', label: 'Settlement Q&A', icon: MessageCircle },
];

interface SidebarProps {
  active: ViewType;
  onNavigate: (view: ViewType) => void;
}

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="w-60 min-h-screen bg-bg-sidebar border-r border-border-subtle flex flex-col shrink-0">
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-border-subtle">
        <div className="w-8 h-8 rounded-lg bg-accent-razorpay/20 flex items-center justify-center">
          <Zap className="w-4.5 h-4.5 text-accent-razorpay" />
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-bold text-text-primary">AI Finance</h1>
          <p className="text-[10px] text-text-muted font-medium">Controller</p>
        </div>
      </div>
      <nav className="flex-1 py-3 px-3 flex flex-col gap-0.5">
        {navItems.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left transition-colors ${
                isActive
                  ? 'bg-accent-razorpay/15 text-accent-razorpay'
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }`}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-border-subtle">
        <p className="text-[10px] text-text-muted">Powered by</p>
        <p className="text-xs font-semibold text-accent-razorpay">Razorpay AI</p>
      </div>
    </aside>
  );
}
