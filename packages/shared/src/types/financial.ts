/**
 * Financial Types
 * Transaction, metrics, and capital flow types
 */

export interface Transaction {
  id: string;
  accountId: string;
  mercuryTransactionId?: string;
  date: Date;
  description: string;
  amount: number;
  status: 'pending' | 'posted' | 'failed';
  category?: string;
  counterparty?: string;
  counterpartyId?: string;
  note?: string;
  createdAt: Date;
}

export interface BusinessMetric {
  id: string;
  entityId: string;
  month: Date;
  revenue: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
  // Profit distribution per FINANCIAL_FLOWS.md
  toBusiness: number;
  toKFG: number;
  toKBG: number;
  toReserve: number;
  toOwner: number;
  // Optional KPIs
  clientCount?: number;
  mrr?: number;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
}

export interface CapitalFlow {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  amount: number;
  flowType: 'profit_distribution' | 'investment_return' | 'owner_draw';
  month: Date;
  status: 'pending' | 'transferred' | 'verified';
  transferDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
