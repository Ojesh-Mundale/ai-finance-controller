import { useEffect, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, BarChart3 } from 'lucide-react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import MetricCard from './MetricCard';
import { api } from '../api/client';
import type { ForecastData } from '../types';
import LoadingSpinner from './LoadingSpinner';

function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
}

export default function ForecastView() {
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getCashForecast()
      .then(setForecast)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load forecast'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="text-accent-red text-sm bg-accent-red/10 border border-accent-red/20 rounded-lg px-4 py-3">{error}</div>;
  if (forecast.length === 0) return <div className="text-center py-20 text-text-muted">No forecast data available. Compute cash positions first.</div>;

  const avgInflow = forecast.reduce((s, f) => s + f.predictedInflow, 0) / forecast.length;
  const avgOutflow = forecast.reduce((s, f) => s + f.predictedOutflow, 0) / forecast.length;
  const netCashFlow = forecast.reduce((s, f) => s + f.netCashFlow, 0);

  const chartData = forecast.map(f => ({
    date: new Date(f.forecastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    balance: f.predictedBalance,
    upper: f.predictedBalance * (1 + (1 - f.confidence) * 0.5),
    lower: f.predictedBalance * (1 - (1 - f.confidence) * 0.5),
    inflow: f.predictedInflow,
    outflow: -f.predictedOutflow,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold">Cash Forecast</h2>
        <p className="text-text-muted text-sm mt-0.5">AI-predicted cash flow for upcoming days</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard title="Net Cash Flow" value={formatINR(netCashFlow)} icon={<BarChart3 className="w-5 h-5" />} accentColor={netCashFlow >= 0 ? 'text-accent-green' : 'text-accent-red'} />
        <MetricCard title="Avg Daily Inflow" value={formatINR(avgInflow)} icon={<ArrowDownCircle className="w-5 h-5" />} accentColor="text-accent-green" />
        <MetricCard title="Avg Daily Outflow" value={formatINR(avgOutflow)} icon={<ArrowUpCircle className="w-5 h-5" />} accentColor="text-accent-red" />
      </div>

      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-text-secondary mb-4">Predicted Balance (with confidence band)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
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
              <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandGrad)" />
              <Area type="monotone" dataKey="lower" stroke="none" fill="#0a0e1a" />
              <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border-medium">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-right py-3 px-4">Predicted Inflow</th>
                <th className="text-right py-3 px-4">Predicted Outflow</th>
                <th className="text-right py-3 px-4">Net Flow</th>
                <th className="text-right py-3 px-4">Predicted Balance</th>
                <th className="text-right py-3 px-4">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((f, i) => (
                <tr key={f.forecastDate} className={i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}>
                  <td className="py-2.5 px-4 text-text-secondary">{new Date(f.forecastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="py-2.5 px-4 text-right text-accent-green">{formatINR(f.predictedInflow)}</td>
                  <td className="py-2.5 px-4 text-right text-accent-red">{formatINR(f.predictedOutflow)}</td>
                  <td className={`py-2.5 px-4 text-right font-medium ${f.netCashFlow >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{formatINR(f.netCashFlow)}</td>
                  <td className="py-2.5 px-4 text-right font-medium text-text-primary">{formatINR(f.predictedBalance)}</td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="confidence-bar w-16">
                        <div className={`confidence-bar-fill ${f.confidence >= 0.8 ? 'bg-accent-green' : f.confidence >= 0.6 ? 'bg-accent-amber' : 'bg-accent-red'}`} style={{ width: `${f.confidence * 100}%` }} />
                      </div>
                      <span className="text-xs text-text-secondary w-10 text-right">{(f.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
