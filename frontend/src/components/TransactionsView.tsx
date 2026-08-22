import { useEffect, useState, useMemo } from 'react';
import { Download, Search } from 'lucide-react';
import { api } from '../api/client';
import type { Transaction, TransactionSource, TransactionStatus } from '../types';
import { StatusBadge, SourceBadge, TypeBadge } from './StatusBadge';
import LoadingSpinner from './LoadingSpinner';

const SOURCES: (TransactionSource | 'ALL')[] = ['ALL', 'BANK_STATEMENT', 'PAYMENT_GATEWAY', 'INTERNAL_LEDGER', 'UPI'];
const STATUSES: (TransactionStatus | 'ALL')[] = ['ALL', 'MATCHED', 'PARTIAL_MATCH', 'UNMATCHED', 'EXCEPTION', 'PENDING_REVIEW'];

const PAGE_SIZE = 20;

function formatINR(val: string): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(parseFloat(val));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TransactionsView() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<TransactionSource | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getTransactions({
      source: sourceFilter === 'ALL' ? undefined : sourceFilter,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    })
      .then(setTransactions)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load transactions'))
      .finally(() => setLoading(false));
    setPage(0);
  }, [sourceFilter, statusFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(t =>
      t.transactionRef.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.counterpartName.toLowerCase().includes(q)
    );
  }, [transactions, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'transactions.json'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Transactions</h2>
          <p className="text-text-muted text-sm mt-0.5">All financial transactions across sources</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-border-subtle rounded-lg text-sm text-text-secondary transition-colors">
          <Download className="w-4 h-4" /> Export JSON
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by ref, description, counterpart..."
            className="w-full bg-white/5 border border-border-subtle rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50"
          />
        </div>
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value as TransactionSource | 'ALL')}
          className="bg-white/5 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue/50"
        >
          {SOURCES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Sources' : s.replace('_', ' ')}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as TransactionStatus | 'ALL')}
          className="bg-white/5 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue/50"
        >
          {STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="text-accent-red text-sm bg-accent-red/10 border border-accent-red/20 rounded-lg px-4 py-3">{error}</div>
      ) : (
        <>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border-medium">
                    <th className="text-left py-3 px-4">Ref</th>
                    <th className="text-left py-3 px-4">Source</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-right py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Counterpart</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-text-muted">No transactions found</td></tr>
                  ) : pageData.map((t, i) => (
                    <tr key={t.id} className={i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}>
                      <td className="py-2.5 px-4 font-mono text-xs text-text-primary max-w-[120px] truncate">{t.transactionRef}</td>
                      <td className="py-2.5 px-4"><SourceBadge source={t.source} /></td>
                      <td className="py-2.5 px-4"><TypeBadge type={t.type} /></td>
                      <td className={`py-2.5 px-4 text-right font-medium ${t.type === 'CREDIT' || t.type === 'SETTLEMENT' ? 'text-accent-green' : 'text-text-primary'}`}>{formatINR(t.amount)}</td>
                      <td className="py-2.5 px-4 text-text-secondary max-w-[150px] truncate">{t.counterpartName}</td>
                      <td className="py-2.5 px-4 text-text-secondary text-xs whitespace-nowrap">{formatDate(t.transactionDate)}</td>
                      <td className="py-2.5 px-4"><StatusBadge status={t.status} /></td>
                      <td className="py-2.5 px-4 text-right text-text-secondary text-xs">
                        {t.confidenceScore != null ? `${(t.confidenceScore * 100).toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-text-secondary text-xs"
              >Previous</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = idx;
                } else if (page < 3) {
                  pageNum = idx;
                } else if (page > totalPages - 4) {
                  pageNum = totalPages - 7 + idx;
                } else {
                  pageNum = page - 3 + idx;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs ${page === pageNum ? 'bg-accent-blue text-white' : 'bg-white/5 hover:bg-white/10 text-text-secondary'}`}
                  >{pageNum + 1}</button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-text-secondary text-xs"
              >Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}