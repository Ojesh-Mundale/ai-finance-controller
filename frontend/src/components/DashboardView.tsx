import { useEffect, useState } from 'react';
import { Activity, CheckCircle, Shield, AlertTriangle, RefreshCw, TrendingUp, MessageCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import MetricCard from './MetricCard';
import { api } from '../api/client';
import type { DashboardMetrics, StatusCounts, ReconciliationHistoryItem } from '../types';

const STATUS_COLORS: Record<string, string> = {
  MATCHED: '#10b981',
  PARTIAL_MATCH: '#f59e0b',
  UNMATCHED: '#ef4444',
  EXCEPTION: '#f43f5e',
  PENDING_REVIEW: '#64748b',
};

function matchRateColor(rate: string): string {
  const num = parseFloat(rate);
  if (num >= 80) return 'text-accent-green';
  if (num >= 60) return 'text-accent-amber';
  return 'text-accent-red';
}

function confidenceColor(val: number): string {
  if (val >= 85) return 'text-accent-green';
  if (val >= 70) return 'text-accent-amber';
  return 'text-accent-red';
}

interface Props {
  onNavigate: (view: 'reconciliation' | 'cash-position' | 'settlement-qa') => void;
}

export default function DashboardView({ onNavigate }: Props) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [statusCounts, setStatusCounts] = useState<StatusCounts | null>(null);
  const [history, setHistory] = useState<ReconciliationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [m, s, h] = await Promise.all([
          api.getMetrics(),
          api.getTransactionCountByStatus(),
          api.getReconciliationHistory(),
        ]);
        setMetrics(m);
        setStatusCounts(s);
        setHistory(h);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-accent-blue" /></div>;
  if (error) return <div className="text-accent-red text-center py-20">{error}</div>;
  if (!metrics || !statusCounts) return null;

  const pieData = Object.entries(statusCounts).map(([key, value]) => ({
    name: key.replace('_', ' '),
    value,
    color: STATUS_COLORS[key] ?? '#64748b',
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold">Dashboard</h2>
        <p className="text-text-muted text-sm mt-0.5">Real-time financial overview</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Transactions"
          value={metrics.totalTransactions.toLocaleString('en-IN')}
          icon={<Activity className="w-5 h-5" />}
          accentColor="text-accent-blue"
        />
        <MetricCard
          title="Match Rate"
          value={metrics.matchRate}
          icon={<CheckCircle className="w-5 h-5" />}
          accentColor={matchRateColor(metrics.matchRate)}
          subtitle="Cross-source accuracy"
        />
        <MetricCard
          title="Avg Confidence"
          value={`${metrics.avgConfidence.toFixed(1)}%`}
          icon={<Shield className="w-5 h-5" />}
          accentColor={confidenceColor(metrics.avgConfidence)}
        />
        <MetricCard
          title="Exceptions"
          value={metrics.exceptionCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          accentColor={metrics.exceptionCount > 0 ? 'text-accent-red' : 'text-accent-green'}
          subtitle={metrics.exceptionCount > 0 ? 'Needs attention' : 'All clear'}
        />
      </div>

      {/* Charts + History */}
      <div className="grid grid-cols-5 gap-4">
        {/* Donut chart */}
        <div className="col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-text-secondary mb-4">Status Distribution</h3>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: '#f1f5f9' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </div>

        {/* Reconciliation history table */}
        <div className="col-span-3 glass-card p-5">
          <h3 className="text-sm font-semibold text-text-secondary mb-4">Recent Reconciliations</h3>
          {history.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-12">No reconciliation runs yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border-medium">
                    <th className="text-left py-2 px-2">Batch ID</th>
                    <th className="text-right py-2 px-2">Match Rate</th>
                    <th className="text-right py-2 px-2">Records</th>
                    <th className="text-right py-2 px-2">Time (ms)</th>
                    <th className="text-right py-2 px-2">When</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 5).map((h, i) => (
                    <tr
                      key={h.batchId}
                      className={`cursor-pointer hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}`}
                      onClick={() => onNavigate('reconciliation')}
                    >
                      <td className="py-2.5 px-2 font-mono text-xs text-text-primary">{h.batchId.slice(0, 8)}...</td>
                      <td className={`py-2.5 px-2 text-right font-semibold ${matchRateColor(h.matchRate)}`}>{h.matchRate}</td>
                      <td className="py-2.5 px-2 text-right text-text-secondary">{h.totalRecords}</td>
                      <td className="py-2.5 px-2 text-right text-text-secondary">{h.processingTimeMs}</td>
                      <td className="py-2.5 px-2 text-right text-text-muted text-xs">
                        {new Date(h.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <button
          onClick={() => onNavigate('reconciliation')}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-lg text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Run Reconciliation
        </button>
        <button
          onClick={() => onNavigate('cash-position')}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary border border-border-subtle rounded-lg text-sm font-medium"
        >
          <TrendingUp className="w-4 h-4" />
          Compute Cash Position
        </button>
        <button
          onClick={() => onNavigate('settlement-qa')}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary border border-border-subtle rounded-lg text-sm font-medium"
        >
          <MessageCircle className="w-4 h-4" />
          Ask Settlement Question
        </button>
      </div>
    </div>
  );
}
