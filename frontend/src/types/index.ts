export type TransactionSource = 'BANK_STATEMENT' | 'PAYMENT_GATEWAY' | 'INTERNAL_LEDGER' | 'UPI';

export type TransactionType = 'CREDIT' | 'DEBIT' | 'REFUND' | 'FEE' | 'SETTLEMENT';

export type TransactionStatus = 'MATCHED' | 'PARTIAL_MATCH' | 'UNMATCHED' | 'EXCEPTION' | 'PENDING_REVIEW';

export type ExceptionSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Transaction {
  id: string;
  transactionRef: string;
  source: TransactionSource;
  type: TransactionType;
  amount: string;
  currency: string;
  description: string;
  counterpartName: string;
  counterpartAccount: string;
  transactionDate: string;
  status: TransactionStatus;
  confidenceScore: number | null;
  matchedWith: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MatchedTransactionSummary {
  transactionRef: string;
  source: TransactionSource;
  amount: string;
  matchedWith: string;
  confidenceScore: number;
}

export interface ExceptionRecord {
  id: string;
  batchId: string;
  transactionRef: string;
  reason: string;
  suggestedAction: string;
  severity: ExceptionSeverity;
  resolved: boolean;
  createdAt: string;
}

export interface ReconciliationRequest {
  sources: TransactionSource[];
  matchThreshold: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface ReconciliationResponse {
  batchId: string;
  totalRecords: number;
  matchedCount: number;
  partialMatchCount: number;
  unmatchedCount: number;
  exceptionCount: number;
  matchRate: string;
  averageConfidence: number;
  processingTimeMs: number;
  status: string;
  exceptions: ExceptionRecord[];
  matchedTransactions: MatchedTransactionSummary[];
}

export interface ReconciliationHistoryItem {
  id: string;
  batchId: string;
  totalRecords: number;
  matchedCount: number;
  partialMatchCount: number;
  unmatchedCount: number;
  exceptionCount: number;
  matchRate: string;
  averageConfidence: number;
  processingTimeMs: number;
  startedAt: string;
  completedAt: string;
  status: string;
}

export interface DashboardMetrics {
  totalTransactions: number;
  matchRate: string;
  avgConfidence: number;
  exceptionCount: number;
  pendingSettlements: number;
  cashPosition: number;
  processingThroughput: number;
  lastReconciliationTime: string | null;
}

export interface StatusCounts {
  MATCHED: number;
  PARTIAL_MATCH: number;
  UNMATCHED: number;
  EXCEPTION: number;
  PENDING_REVIEW: number;
}

export interface CashPosition {
  date: string;
  openingBalance: number;
  totalInflows: number;
  totalOutflows: number;
  closingBalance: number;
  pendingSettlements: number;
  forecastedBalance: number;
}

export interface ForecastData {
  forecastDate: string;
  predictedInflow: number;
  predictedOutflow: number;
  netCashFlow: number;
  predictedBalance: number;
  confidence: number;
  modelVersion: string;
}

export interface SettlementQARequest {
  question: string;
  context?: string;
}

export interface SettlementQAResponse {
  answer: string;
  confidence: number;
  sources: string[];
  relatedTransactions: string[];
}

export type ViewType = 'dashboard' | 'reconciliation' | 'transactions' | 'cash-position' | 'forecast' | 'settlement-qa';
