export interface CreditLedgerEntry {
  id: string;
  userKey: string;
  requestId: number;
  amount: number;
  createdAt: string;
  note?: string;
}
