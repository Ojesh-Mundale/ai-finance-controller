import type {
  Transaction,
  TransactionSource,
  TransactionStatus,
  ReconciliationRequest,
  ReconciliationResponse,
  ReconciliationHistoryItem,
  DashboardMetrics,
  StatusCounts,
  CashPosition,
  ForecastData,
  SettlementQARequest,
  SettlementQAResponse,
  ExceptionRecord,
} from '../types';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new ApiError(res.status, text);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Dashboard
  getMetrics(): Promise<DashboardMetrics> {
    return request('/dashboard/metrics');
  },

  // Reconciliation
  runReconciliation(req: ReconciliationRequest): Promise<ReconciliationResponse> {
    return request('/reconciliation/run', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  getReconciliationHistory(): Promise<ReconciliationHistoryItem[]> {
    return request('/reconciliation/history');
  },

  getBatchTransactions(batchId: string): Promise<Transaction[]> {
    return request(`/reconciliation/batch/${batchId}/transactions`);
  },

  getBatchExceptions(batchId: string): Promise<ExceptionRecord[]> {
    return request(`/reconciliation/batch/${batchId}/exceptions`);
  },

  // Transactions
  getTransactions(params?: {
    source?: TransactionSource;
    status?: TransactionStatus;
  }): Promise<Transaction[]> {
    const searchParams = new URLSearchParams();
    if (params?.source) searchParams.set('source', params.source);
    if (params?.status) searchParams.set('status', params.status);
    const qs = searchParams.toString();
    return request(`/transactions${qs ? `?${qs}` : ''}`);
  },

  getTransactionCountByStatus(): Promise<StatusCounts> {
    return request('/transactions/count/by-status');
  },

  // Cash Position
  computeCashPosition(): Promise<string> {
    return request('/cash-position/compute', { method: 'POST' });
  },

  getCashPositions(): Promise<CashPosition[]> {
    return request('/cash-position');
  },

  getCashForecast(): Promise<ForecastData[]> {
    return request('/cash-position/forecast');
  },

  // Settlement Q&A
  askSettlementQA(req: SettlementQARequest): Promise<SettlementQAResponse> {
    return request('/settlement-qa/ask', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },
};

export { ApiError };
