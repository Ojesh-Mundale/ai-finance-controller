import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, ArrowDownCircle, ArrowUpCircle, Wallet, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from './MetricCard';
import { api } from '../api/client';
import type { CashPosition } from '../types';
import LoadingSpinner from './LoadingSpinner';

function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
}

export default function CashPositionView() {
  const [positions, setPositions] = useState<CashPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getCashPositions()
      .then(setPositions)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load cash positions'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const compute = async () => {
    setComputing(true);
    setMsg(null);
    try {
      await api.computeCashPosition();
      setMsg('Cash positions computed successfully');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Compute failed');
    } finally {
      setComputing(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><LoadingSpinner size="lg" /></div>;
  if (error && positions.length === 0) return <div className="text-accent-red text-sm bg-accent-red/10 border border-accent-red/20 rounded-lg px-4 py-3">{error}</div>;

  const latest = positions[positions.length - 1];
  const chartData = positions.map(p => ({
    date: new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    closing: p.closingBalance,
    inflows: p.totalInflows,
    outflows: -p.totalOutflows,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Cash Position</h2>
          <p className="text-text-muted text-sm mt-0.5">Daily cash flow summary and positions</p>
        </div>
        <button
          onClick={compute}
          disabled={computing}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent-blue hover:bg-accent-blue/80 disabled:opacity-50 text-white rounded-lg text-sm font-semibold"
        >
          {computing ? <LoadingSpinner size="sm" /> : <TrendingUp className="w-4 h-4" />}
          {computing ? 'Computing...' : 'Compute Position'}
        </button>
      </div>

      {msg && <div className="text-accent-green text-sm bg-accent-green/10 border border-accent-green/20 rounded-lg px-4 py-3">{msg}</div>}
      {error && positions.length > 0 && <div className="text-accent-red text-sm bg-accent-red/10 border border-accent-red/20 rounded-lg px-4 py-3">{error}</div>}

      {latest && (
        <div className="grid grid-cols-5 gap-4">
          <MetricCard title="Opening Balance" value={formatINR(latest.openingBalance)} icon={<Wallet className="w-5 h-5" />} accentColor="text-accent-blue" />
          <MetricCard title="Total Inflows" value={formatINR(latest.totalInflows)} icon={<ArrowDownCircle className="w-5 h-5" />} accentColor="text-accent-green" />
          <MetricCard title="Total Outflows" value={formatINR(latest.totalOutflows)} icon={<ArrowUpCircle className="w-5 h-5" />} accentColor="text-accent-red" />
          <MetricCard title="Closing Balance" value={formatINR(latest.closingBalance)} icon={<TrendingUp className="w-5 h-5" />} accentColor="text-accent-blue" />
          <MetricCard title="Pending Settlements" value={formatINR(latest.pendingSettlements)} icon={<Clock className="w-5 h-5" />} accentColor="text-accent-amber" />
        </div>
      )}

      {chartData.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-text-secondary mb-4">Cash Position Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="closingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickFormatter={(v: number) => `${(v / 100000).toFixed(1)}L`} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: '#f1f5f9' }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value: number) => formatINR(value)}
                />
                <Area type="monotone" dataKey="closing" stroke="#3b82f6" fill="url(#closingGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {positions.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border-medium">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-right py-3 px-4">Opening</th>
                  <th className="text-right py-3 px-4">Inflows</th>
                  <th className="text-right py-3 px-4">Outflows</th>
                  <th className="text-right py-3 px-4">Closing</th>
                  <th className="text-right py-3 px-4">Pending</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p, i) => (
                  <tr key={p.date} className={i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}>
                    <td className="py-2.5 px-4 text-text-secondary">{new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="py-2.5 px-4 text-right text-text-primary">{formatINR(p.openingBalance)}</td>
                    <td className="py-2.5 px-4 text-right text-accent-green">{formatINR(p.totalInflows)}</td>
                    <td className="py-2.5 px-4 text-right text-accent-red">{formatINR(p.totalOutflows)}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-text-primary">{formatINR(p.closingBalance)}</td>
                    <td className="py-2.5 px-4 text-right text-accent-amber">{formatINR(p.pendingSettlements)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
