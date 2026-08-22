import type { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  accentColor?: string;
  subtitle?: string;
}

export default function MetricCard({ title, value, icon, accentColor = 'text-accent-blue', subtitle }: MetricCardProps) {
  return (
    <div className="glass-card p-5 flex items-start gap-4 animate-fade-in">
      <div className={`rounded-xl p-2.5 ${accentColor === 'text-accent-blue' ? 'bg-accent-blue/10' : accentColor === 'text-accent-green' ? 'bg-accent-green/10' : accentColor === 'text-accent-amber' ? 'bg-accent-amber/10' : accentColor === 'text-accent-red' ? 'bg-accent-red/10' : 'bg-accent-blue/10'}`}>
        <span className={accentColor}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-text-muted text-xs font-medium uppercase tracking-wider">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${accentColor}`}>{value}</p>
        {subtitle && <p className="text-text-muted text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
