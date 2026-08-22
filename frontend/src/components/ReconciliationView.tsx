import { useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import type { TransactionSource, ReconciliationResponse, ExceptionSeverity } from '../types';
import { SourceBadge, SeverityBadge } from './StatusBadge';
import LoadingSpinner from './LoadingSpinner';

const SOURCES: TransactionSource[] = ['BANK_STATEMENT', 'PAYMENT_GATEWAY', 'INTERNAL_LEDGER', 'UPI'];
const SOURCE_LABELS: Record<TransactionSource, string> = {
  BANK_STATEMENT: 'Bank Statement',
  PAYMENT_GATEWAY: 'Payment Gateway',
  INTERNAL_LEDGER: 'Internal Ledger',
  UPI: 'UPI',
};

function formatINR(val: string | number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(typeof val === 'string' ? parseFloat(val) : val);
}

function confidenceColor(val: number): string {
  if (val >= 90) return 'bg-accent-green';
  if (val >= 75) return 'bg-accent-amber';
  return 'bg-accent-red';
}

type Tab = 'matched' | 'exceptions';

type SortKey = 'confidenceScore' | 'amount';
type SortDir = 'asc' | 'desc';

export default function ReconciliationView() {
  const [sources, setSources] = useState<TransactionSource[]>([...SOURCES]);
  const [threshold, setThreshold] = useState(0.75);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ReconciliationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('matched');
  const [severityFilter, setSeverityFilter] = useState<ExceptionSeverity | 'ALL'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('confidenceScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSource = (s: TransactionSource) => {
    setSources(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const run = useCallback(async () => {
    if (sources.length === 0) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const req: Parameters<typeof api.runReconciliation>[0] = {
        sources,
        matchThreshold: threshold,
      };
      if (dateFrom) req.dateFrom = dateFrom;
      if (dateTo) req.dateTo = dateTo;
      const res = await api.runReconciliation(req);
      setResult(res);
      setTab('matched');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reconciliation failed');
    } finally {
      setRunning(false);
    }
  }, [sources, threshold, dateFrom, dateTo]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedMatched = result?.matchedTransactions
    ? [...result.matchedTransactions].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      })
    : [];

  const filteredExceptions = result?.exceptions
    ? (severityFilter === 'ALL' ? result.exceptions : result.exceptions.filter(e => e.severity === severityFilter))
    : [];

  const matchRateNum = result ? parseFloat(result.matchRate) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold">Reconciliation</h2>
        <p className="text-text-muted text-sm mt-0.5">Cross-source AI-powered transaction matching</p>
      </div>

      {/* Config panel */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-text-secondary">Configuration</h3>

        <div>
          <label className="text-xs text-text-muted mb-2 block">Data Sources</label>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map(s => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sources.includes(s)}
                  onChange={() => toggleSource(s)}
                  className="rounded border-border-medium bg-white/5 text-accent-blue focus:ring-accent-blue/30"
                />
                <span className="text-sm text-text-secondary">{SOURCE_LABELS[s]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex-1">
            <label className="text-xs text-text-muted mb-1.5 block">
              Match Threshold: <span className="text-text-primary font-semibold">{threshold.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={0.5}
              max={1.0}
              step={0.05}
              value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-accent-blue"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="bg-white/5 border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue/50"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="bg-white/5 border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue/50"
            />
          </div>
        </div>

        <button
          onClick={run}
          disabled={running || sources.length === 0}
          className="flex items-center gap-2.5 px-6 py-2.5 bg-accent-blue hover:bg-accent-blue/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
        >
          {running ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
          {running ? 'Running...' : 'Run Reconciliation'}
        </button>
      </div>

      {error && <div className="text-accent-red text-sm bg-accent-red/10 border border-accent-red/20 rounded-lg px-4 py-3">{error}</div>}

      {result && (
        <div className="space-y-5 animate-fade-in">
          {/* Result banner */}
          <div className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Batch ID</span>
                <span className="font-mono text-sm text-text-primary">{result.batchId.slice(0, 12)}...</span>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${result.status === 'COMPLETED' ? 'bg-accent-green/15 text-accent-green' : 'bg-accent-amber/15 text-accent-amber'}`}>{result.status}</span>
            </div>
            <span className="text-xs text-text-muted">{result.processingTimeMs}ms</span>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-5 gap-3">
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider">Total</p>
              <p className="text-xl font-bold mt-1 text-text-primary">{result.totalRecords}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider">Matched</p>
              <p className="text-xl font-bold mt-1 text-accent-green">{result.matchedCount}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider">Partial</p>
              <p className="text-xl font-bold mt-1 text-accent-amber">{result.partialMatchCount}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider">Unmatched</p>
              <p className="text-xl font-bold mt-1 text-accent-red">{result.unmatchedCount}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider">Exceptions</p>
              <p className="text-xl font-bold mt-1 text-accent-rose">{result.exceptionCount}</p>
            </div>
          </div>

          {/* Match rate progress bar */}
          <div className="glass-card p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-text-muted font-medium">Match Rate</span>
              <span className={`text-sm font-bold ${matchRateNum >= 80 ? 'text-accent-green' : matchRateNum >= 60 ? 'text-accent-amber' : 'text-accent-red'}`}>{result.matchRate}</span>
            </div>
            <div className="confidence-bar">
              <div
                className={`confidence-bar-fill ${matchRateNum >= 80 ? 'bg-accent-green' : matchRateNum >= 60 ? 'bg-accent-amber' : 'bg-accent-red'}`}
                style={{ width: `${matchRateNum}%` }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border-subtle">
            <button
              onClick={() => setTab('matched')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'matched' ? 'border-accent-blue text-text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'}`}
            >
              Matched Transactions ({result.matchedTransactions.length})
            </button>
            <button
              onClick={() => setTab('exceptions')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'exceptions' ? 'border-accent-rose text-text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'}`}
            >
              Exceptions ({result.exceptions.length})
            </button>
          </div>

          {/* Matched table */}
          {tab === 'matched' && (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border-medium">
                      <th className="text-left py-3 px-4">Ref</th>
                      <th className="text-left py-3 px-4">Source</th>
                      <th className="text-right py-3 px-4 cursor-pointer select-none hover:text-text-secondary" onClick={() => toggleSort('amount')}>
                        Amount {sortKey === 'amount' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="text-left py-3 px-4">Matched With</th>
                      <th className="text-right py-3 px-4 cursor-pointer select-none hover:text-text-secondary" onClick={() => toggleSort('confidenceScore')}>
                        Confidence {sortKey === 'confidenceScore' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMatched.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-12 text-text-muted">No matched transactions</td></tr>
                    ) : sortedMatched.map((t, i) => (
                      <tr key={t.transactionRef + i} className={i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}>
                        <td className="py-2.5 px-4 font-mono text-xs text-text-primary">{t.transactionRef}</td>
                        <td className="py-2.5 px-4"><SourceBadge source={t.source} /></td>
                        <td className="py-2.5 px-4 text-right font-medium text-text-primary">{formatINR(t.amount)}</td>
                        <td className="py-2.5 px-4 font-mono text-xs text-text-secondary">{t.matchedWith}</td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <div className="confidence-bar w-16">
                              <div className={`confidence-bar-fill ${confidenceColor(t.confidenceScore)}`} style={{ width: `${t.confidenceScore * 100}%` }} />
                            </div>
                            <span className="text-xs font-medium text-text-secondary w-12 text-right">{(t.confidenceScore * 100).toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Exceptions table */}
          {tab === 'exceptions' && (
            <>
              <div className="flex gap-2">
                {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      severityFilter === sev
                        ? 'bg-white/10 text-text-primary'
                        : 'bg-transparent text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {sev === 'ALL' ? 'All' : sev}
                  </button>
                ))}
              </div>
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border-medium">
                        <th className="text-left py-3 px-4">Transaction Ref</th>
                        <th className="text-left py-3 px-4">Reason</th>
                        <th className="text-left py-3 px-4">Suggested Action</th>
                        <th className="text-left py-3 px-4">Severity</th>
                        <th className="text-left py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExceptions.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-12 text-text-muted">No exceptions found</td></tr>
                      ) : filteredExceptions.map((e, i) => (
                        <tr key={e.id} className={i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}>
                          <td className="py-2.5 px-4 font-mono text-xs text-text-primary">{e.transactionRef}</td>
                          <td className="py-2.5 px-4 text-text-secondary max-w-xs truncate">{e.reason}</td>
                          <td className="py-2.5 px-4 text-text-secondary max-w-xs truncate">{e.suggestedAction}</td>
                          <td className="py-2.5 px-4"><SeverityBadge severity={e.severity} /></td>
                          <td className="py-2.5 px-4">
                            <span className={`text-xs ${e.resolved ? 'text-accent-green' : 'text-accent-amber'}`}>
                              {e.resolved ? 'Resolved' : 'Open'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}