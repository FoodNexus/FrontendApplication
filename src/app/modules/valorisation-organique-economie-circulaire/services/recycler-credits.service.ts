import { Injectable } from '@angular/core';
import { AuthService } from '../../gestion-user/services/auth.service';
import { environment } from '../../../../environments/environment';

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
/** Objectif annuel d’opérations de recyclage validées (affichage mini-jeu). */
export const NUTRIFLOW_YEARLY_RECYCLING_GOAL = 400;

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
    if (userKey != null) {
      return this.readLedger()
        .filter((e) => e.userKey === userKey)
        .reduce((sum, e) => sum + e.amount, 0);
    }
    const aliases = new Set(this.auth.getNutriflowUserKeyAliases());
    return this.readLedger()
      .filter((e) => aliases.has(e.userKey))
      .reduce((sum, e) => sum + e.amount, 0);
  }

  getLedgerForUser(userKey?: string): CreditLedgerEntry[] {
    if (userKey != null) {
      return this.readLedger()
        .filter((e) => e.userKey === userKey)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    const aliases = new Set(this.auth.getNutriflowUserKeyAliases());
    return this.readLedger()
      .filter((e) => aliases.has(e.userKey))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getAllLedger(): CreditLedgerEntry[] {
    return [...this.readLedger()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** Somme des crédits positifs (opérations validées) sur l’année civile en cours — pour un utilisateur ou le compte courant (alias). */
  getYearlyVerifiedOperationCount(userKey?: string | null): number {
    const year = new Date().getFullYear();
    const ledger = this.readLedger();
    const matchYear = (e: CreditLedgerEntry): boolean => {
      if (e.amount <= 0) {
        return false;
      }
      const d = new Date(e.createdAt);
      return !Number.isNaN(d.getTime()) && d.getFullYear() === year;
    };
    if (userKey != null && userKey.length > 0) {
      return ledger.filter((e) => matchYear(e) && e.userKey === userKey).reduce((s, e) => s + e.amount, 0);
    }
    const aliases = new Set(this.auth.getNutriflowUserKeyAliases());
    return ledger.filter((e) => matchYear(e) && aliases.has(e.userKey)).reduce((s, e) => s + e.amount, 0);
  }

  /** Classement local (session) des opérations validées cette année, par clé NutriFlow. */
  getYearlyLeaderboard(limit = 16): { userKey: string; ops: number }[] {
    const year = new Date().getFullYear();
    const map = new Map<string, number>();
    for (const e of this.readLedger()) {
      if (e.amount <= 0) {
        continue;
      }
      const d = new Date(e.createdAt);
      if (Number.isNaN(d.getTime()) || d.getFullYear() !== year) {
        continue;
      }
      map.set(e.userKey, (map.get(e.userKey) ?? 0) + e.amount);
    }
    return [...map.entries()]
      .map(([userKey, ops]) => ({ userKey, ops }))
      .sort((a, b) => b.ops - a.ops)
      .slice(0, limit);
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

  /**
   * Dev non-prod : octroie des crédits initiaux selon environment.nutriflowDevSeedCreditsByUsername
   * (clé = Keycloak preferred_username). Idempotent via plage d’IDs de demande réservée.
   */
  maybeApplyDevNutriflowCreditSeed(): void {
    const map = environment.nutriflowDevSeedCreditsByUsername;
    if (environment.production || map == null || typeof window === 'undefined') {
      return;
    }
    const raw = this.auth.getKeycloakPreferredUsername();
    if (!raw) {
      return;
    }
    const username = raw.toLowerCase();
    const amount = map[username];
    if (amount == null || amount < 1 || !Number.isFinite(amount)) {
      return;
    }
    const userKey = this.getCurrentRecyclerKey();
    if (userKey === 'local:anonymous') {
      return;
    }
    const base = this.devNutriflowSeedRequestIdBase(username);
    const n = Math.min(100, Math.floor(amount));
    for (let i = 0; i < n; i++) {
      this.grantForVerifiedRequest(
        userKey,
        base + i,
        'Crédits de démarrage (dev)'
      );
    }
  }

  private devNutriflowSeedRequestIdBase(username: string): number {
    switch (username) {
      case 'recycler':
        return 9_100_000;
      case 'recycler1':
        return 9_101_000;
      default: {
        let h = 0;
        for (let i = 0; i < username.length; i++) {
          h = (h * 31 + username.charCodeAt(i)) | 0;
        }
        return 9_200_000 + (Math.abs(h) % 999) * 100;
      }
    }
  }

  /**
   * Dépense des crédits pour le mini-jeu « planète » (écriture négative dans le journal).
   * @returns false si solde insuffisant
   */
  spendForPlanetGame(amount: number = 1, note?: string): boolean {
    if (amount <= 0 || !Number.isFinite(amount)) {
      return false;
    }
    if (this.getBalance() < amount) {
      return false;
    }
    const data = this.readFile();
    const userKey = this.getCurrentRecyclerKey();
    const requestId = -Math.floor(Date.now() * 1000 + Math.random() * 1000);
    const entry: CreditLedgerEntry = {
      id: `cr-spend-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      userKey,
      requestId,
      amount: -Math.floor(amount),
      createdAt: new Date().toISOString(),
      note: note ?? 'Dépense mini-jeu NutriFlow (pas pour la planète)'
    };
    data.ledger = [entry, ...data.ledger];
    this.writeFile(data);
    return true;
  }

  /**
   * Nombre de sauts « Faire un pas » déjà payés (somme des débits mini-jeu sur le journal).
   * Une montée par crédit dépensé ; aligné sur le ledger (pas de compteur localStorage séparé).
   */
  getPlanetGameJumpSpendTotalForUserKey(userKey: string): number {
    let n = 0;
    for (const e of this.readLedger()) {
      if (e.userKey !== userKey || !this.isPlanetMiniGameSpend(e)) {
        continue;
      }
      n += Math.abs(Math.floor(e.amount));
    }
    return n;
  }

  /** Sauts mini-jeu pour le compte connecté (tous les alias id:/sub:). */
  getPlanetGameJumpSpendTotalForCurrentUser(): number {
    const aliases = new Set(this.auth.getNutriflowUserKeyAliases());
    let n = 0;
    for (const e of this.readLedger()) {
      if (!aliases.has(e.userKey) || !this.isPlanetMiniGameSpend(e)) {
        continue;
      }
      n += Math.abs(Math.floor(e.amount));
    }
    return n;
  }

  private isPlanetMiniGameSpend(e: CreditLedgerEntry): boolean {
    if (e.amount >= 0) {
      return false;
    }
    return (
      e.id.startsWith('cr-spend-') || (e.note ?? '').toLowerCase().includes('mini-jeu')
    );
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
