import { Injectable } from '@angular/core';
import { AuthService } from '../../gestion-user/services/auth.service';

export interface CreditLedgerEntry {
  id: string;
  userKey: string;
  requestId: number;
  amount: number;
  createdAt: string;
  note?: string;
}

interface CreditsFile {
  ledger: CreditLedgerEntry[];
}

export const NUTRIFLOW_CREDITS_STORAGE_KEY = 'nutriflow-recycler-credits';
export const NUTRIFLOW_CREDITS_MUTATED_EVENT = 'nutriflow-credits-mutated';

const STORAGE_KEY = NUTRIFLOW_CREDITS_STORAGE_KEY;
const CREDIT_PER_VERIFIED_OPERATION = 1;

@Injectable({ providedIn: 'root' })
export class RecyclerCreditsService {
  constructor(private auth: AuthService) {}

  /** Identifiant stable pour crédits (préfère l’id base, sinon sub Keycloak). */
  getCurrentRecyclerKey(): string {
    return this.auth.getCreditsUserKey();
  }

  getBalance(userKey?: string): number {
    const key = userKey ?? this.getCurrentRecyclerKey();
    return this.readLedger()
      .filter((e) => e.userKey === key)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  getLedgerForUser(userKey?: string): CreditLedgerEntry[] {
    const key = userKey ?? this.getCurrentRecyclerKey();
    return this.readLedger()
      .filter((e) => e.userKey === key)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getAllLedger(): CreditLedgerEntry[] {
    return [...this.readLedger()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * Attribue des crédits pour une opération validée par l’admin (idempotent par requestId).
   * @returns true si un nouveau crédit a été enregistré
   */
  grantForVerifiedRequest(userKey: string, requestId: number, note?: string): boolean {
    const data = this.readFile();
    if (data.ledger.some((e) => e.requestId === requestId)) {
      return false;
    }
    const entry: CreditLedgerEntry = {
      id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      userKey,
      requestId,
      amount: CREDIT_PER_VERIFIED_OPERATION,
      createdAt: new Date().toISOString(),
      note: note ?? 'Opération de recyclage validée par l’administrateur'
    };
    data.ledger = [entry, ...data.ledger];
    this.writeFile(data);
    return true;
  }

  private readLedger(): CreditLedgerEntry[] {
    return this.readFile().ledger;
  }

  private readFile(): CreditsFile {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ledger: [] };
    }
    try {
      const parsed = JSON.parse(raw) as CreditsFile;
      return { ledger: Array.isArray(parsed.ledger) ? parsed.ledger : [] };
    } catch {
      return { ledger: [] };
    }
  }

  private writeFile(data: CreditsFile): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(NUTRIFLOW_CREDITS_MUTATED_EVENT));
    }
  }
}
