import type { TransactionStatus, TransactionSource, ExceptionSeverity } from '../types';

const statusConfig: Record<TransactionStatus, { label: string; bg: string; text: string }> = {
  MATCHED: { label: 'Matched', bg: 'bg-accent-green/15', text: 'text-accent-green' },
  PARTIAL_MATCH: { label: 'Partial Match', bg: 'bg-accent-amber/15', text: 'text-accent-amber' },
  UNMATCHED: { label: 'Unmatched', bg: 'bg-accent-red/15', text: 'text-accent-red' },
  EXCEPTION: { label: 'Exception', bg: 'bg-accent-rose/15', text: 'text-accent-rose' },
  PENDING_REVIEW: { label: 'Pending Review', bg: 'bg-white/10', text: 'text-text-secondary' },
};

const sourceConfig: Record<TransactionSource, { label: string; bg: string; text: string }> = {
  BANK_STATEMENT: { label: 'Bank', bg: 'bg-blue-500/15', text: 'text-blue-400' },
  PAYMENT_GATEWAY: { label: 'Gateway', bg: 'bg-purple-500/15', text: 'text-purple-400' },
  INTERNAL_LEDGER: { label: 'Ledger', bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  UPI: { label: 'UPI', bg: 'bg-orange-500/15', text: 'text-orange-400' },
};

const severityConfig: Record<ExceptionSeverity, { label: string; bg: string; text: string }> = {
  HIGH: { label: 'High', bg: 'bg-accent-red/15', text: 'text-accent-red' },
  MEDIUM: { label: 'Medium', bg: 'bg-accent-amber/15', text: 'text-accent-amber' },
  LOW: { label: 'Low', bg: 'bg-white/10', text: 'text-text-secondary' },
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  const c = statusConfig[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

export function SourceBadge({ source }: { source: TransactionSource }) {
  const c = sourceConfig[source];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: ExceptionSeverity }) {
  const c = severityConfig[severity];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    CREDIT: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    DEBIT: { bg: 'bg-red-500/15', text: 'text-red-400' },
    REFUND: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
    FEE: { bg: 'bg-gray-500/15', text: 'text-gray-400' },
    SETTLEMENT: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  };
  const c = map[type] ?? { bg: 'bg-white/10', text: 'text-text-secondary' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
      {type}
    </span>
  );
}
