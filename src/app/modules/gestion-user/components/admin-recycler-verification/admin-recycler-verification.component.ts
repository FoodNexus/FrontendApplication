import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import type { RecyclerRequest, RequestStatus } from '../../../valorisation-organique-economie-circulaire/angular/models/recycler-operations.model';
import type { DonorLotRecord } from '../../../valorisation-organique-economie-circulaire/angular/models/donor-lots.model';
import { DonorLotsService } from '../../../valorisation-organique-economie-circulaire/angular/services/donor-lots.service';
import { NutriflowRecyclerRequestsService } from '../../../valorisation-organique-economie-circulaire/angular/services/nutriflow-recycler-requests.service';
import {
  RecyclerCreditsService,
  NUTRIFLOW_CREDITS_MUTATED_EVENT
} from '../../../valorisation-organique-economie-circulaire/angular/services/recycler-credits.service';
import { NUTRIFLOW_HUB_PULLED_EVENT } from '../../../valorisation-organique-economie-circulaire/angular/services/nutriflow-hub-sync.service';

const ACTIVE_REQUEST_STATUSES: RequestStatus[] = [
  'awaiting_donor',
  'pending',
  'approved',
  'available',
  'pending_verification'
];

@Component({
  selector: 'app-admin-recycler-verification',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, DatePipe, DecimalPipe, RouterLink],
  template: `
    <div class="admin-hub py-4">
      <div class="container">
        <header class="hub-header card border-0 shadow-sm mb-4">
          <div class="card-body d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <h1 class="h4 mb-1 text-success">
                <i class="bi bi-recycle me-2"></i>Back-office NutriFlow — recyclage
              </h1>
              <p class="text-muted small mb-0 max-w-prose">
                Toutes les demandes et validations au même endroit. Données locales (navigateur). Les actions
                <strong>Approuver / Rejeter</strong> s’affichent uniquement pour les lignes en attente de vérification.
              </p>
            </div>
            <div class="d-flex flex-wrap gap-2">
              <a routerLink="/user/dashboard" class="btn btn-outline-secondary btn-sm">Dashboard</a>
              <a routerLink="/valorisation/nutriflow/requests" class="btn btn-outline-success btn-sm">NutriFlow recycleur</a>
            </div>
          </div>
        </header>

        <div class="metrics-row card border-0 shadow-sm mb-4">
          <div class="card-body py-3">
            <div class="row g-2 g-md-3 text-center text-md-start">
              <div class="col-6 col-md">
                <div class="metric-pill">
                  <span class="metric-val">{{ overview.totalRequests }}</span>
                  <span class="metric-lbl">Demandes</span>
                </div>
              </div>
              <div class="col-6 col-md">
                <div class="metric-pill">
                  <span class="metric-val">{{ overview.totalKg | number: '1.0-0' }} kg</span>
                  <span class="metric-lbl">Volume demandé</span>
                </div>
              </div>
              <div class="col-6 col-md">
                <div class="metric-pill">
                  <span class="metric-val">{{ overview.listedLots }}</span>
                  <span class="metric-lbl">Lots listés</span>
                </div>
              </div>
              <div class="col-6 col-md">
                <div class="metric-pill">
                  <span class="metric-val text-warning">{{ overview.pendingAdmin }}</span>
                  <span class="metric-lbl">À valider</span>
                </div>
              </div>
              <div class="col-6 col-md">
                <div class="metric-pill">
                  <span class="metric-val">{{ overview.creditGrants }}</span>
                  <span class="metric-lbl">Crédits attribués</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <details class="card border-0 shadow-sm mb-3 collapsible-more">
          <summary class="card-header bg-white py-2 px-3 small fw-semibold user-select-none">
            Lots donateurs publiés ({{ donorLots.length }}) — afficher le détail
          </summary>
          <div class="card-body p-0 border-top">
            <div class="table-responsive" style="max-height: 240px">
              <table class="table table-sm mb-0">
                <thead class="table-light sticky-top">
                  <tr>
                    <th>Donateur</th>
                    <th>Produit</th>
                    <th class="text-end">kg</th>
                    <th>Liste</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let lot of donorLots">
                    <td>{{ displayNameForNutriflowKey(lot.donorUserKey) }}</td>
                    <td>{{ lot.name }}</td>
                    <td class="text-end">{{ lot.quantityKg | number: '1.0-0' }}</td>
                    <td>
                      <span
                        class="badge"
                        [class.bg-success]="lot.listingStatus === 'listed'"
                        [class.bg-secondary]="lot.listingStatus !== 'listed'"
                      >
                        {{ lot.listingStatus }}
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="donorLots.length === 0">
                    <td colspan="4" class="text-center text-muted py-3 small">Aucun lot.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </details>

        <details class="card border-0 shadow-sm mb-4 collapsible-more">
          <summary class="card-header bg-white py-2 px-3 small fw-semibold user-select-none">
            Crédits par recycleur ({{ creditsByUser.length }} compte(s)) — afficher le détail
          </summary>
          <div class="card-body p-0 border-top">
            <p class="small text-muted mb-0 px-3 py-2 bg-light border-bottom">
              +1 crédit par opération approuvée (idempotent par demande).
            </p>
            <div class="table-responsive" style="max-height: 220px">
              <table class="table table-sm mb-0">
                <thead class="table-light sticky-top">
                  <tr>
                    <th>Recycleur</th>
                    <th class="text-end">Solde</th>
                    <th class="text-end">Écritures</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of creditsByUser">
                    <td>{{ displayNameForNutriflowKey(row.userKey) }}</td>
                    <td class="text-end fw-semibold">{{ row.balance | number: '1.0-0' }}</td>
                    <td class="text-end text-muted small">{{ row.entryCount }}</td>
                  </tr>
                  <tr *ngIf="creditsByUser.length === 0">
                    <td colspan="3" class="text-center text-muted py-3 small">Aucun crédit.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </details>

        <section aria-labelledby="main-table-title">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
            <h2 id="main-table-title" class="h6 mb-0 fw-semibold">
              <i class="bi bi-list-task me-1"></i>Toutes les demandes recycleurs
            </h2>
            <label class="small text-muted mb-0 d-flex align-items-center gap-1">
              Filtrer
              <select
                class="form-select form-select-sm"
                style="width: auto"
                [(ngModel)]="requestFilter"
                name="requestFilter"
              >
                <option value="all">Toutes ({{ all.length }})</option>
                <option value="action">À valider ({{ pendingList.length }})</option>
                <option value="active">En cours ({{ activeCount }})</option>
                <option value="closed">Clôturées ({{ closedCount }})</option>
              </select>
            </label>
          </div>

          <div class="alert alert-warning py-2 px-3 small mb-2" *ngIf="pendingList.length > 0 && requestFilter !== 'action'">
            <strong>{{ pendingList.length }}</strong> opération(s) en attente de votre validation —
            <button type="button" class="btn btn-link btn-sm p-0 align-baseline" (click)="requestFilter = 'action'">
              n’afficher que celles-ci
            </button>
          </div>

          <div class="card shadow-sm border-0">
            <div class="card-body p-0">
              <div class="table-responsive main-requests-scroll">
                <table class="table table-sm table-hover mb-0 align-middle">
                  <thead class="table-light sticky-top">
                    <tr>
                      <th>Statut</th>
                      <th>Produit</th>
                      <th class="text-end">kg</th>
                      <th>Recycleur</th>
                      <th>Lot / donateur</th>
                      <th>Logistique</th>
                      <th class="text-nowrap">Demandé</th>
                      <th class="text-nowrap">Vérif.</th>
                      <th class="text-nowrap">Clôture</th>
                      <th>Note</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let r of filteredRequests" [class.table-warning]="isNutriflowAdminCreditVerifiableStatus(r.status)">
                      <td>
                        <span class="badge" [ngClass]="statusRowClass(r.status)">{{ requestStatusBadge(r.status) }}</span>
                      </td>
                      <td class="small fw-semibold">{{ r.productName }}</td>
                      <td class="text-end">{{ r.quantityKg }}</td>
                      <td class="small">{{ displayNameForNutriflowKey(r.recyclerUserKey) }}</td>
                      <td class="small">{{ donorLotSummary(r.donorLotId) }}</td>
                      <td class="small text-muted">{{ logistiqueCell(r) }}</td>
                      <td class="small text-nowrap">{{ r.requestedAt | date: 'short' }}</td>
                      <td class="small text-nowrap text-muted">{{ verificationSubmittedLabel(r) }}</td>
                      <td class="small text-muted">{{ closureCell(r) }}</td>
                      <td class="small">{{ r.note || '—' }}</td>
                      <td class="text-nowrap">
                        <ng-container *ngIf="isNutriflowAdminCreditVerifiableStatus(r.status)">
                          <input
                            type="text"
                            class="form-control form-control-sm mb-1"
                            style="min-width: 140px"
                            [(ngModel)]="rejectNotes[r.id]"
                            [ngModelOptions]="{ standalone: true }"
                            placeholder="Motif si rejet"
                          />
                          <button type="button" class="btn btn-success btn-sm me-1" (click)="approve(r)">Approuver</button>
                          <button type="button" class="btn btn-outline-danger btn-sm" (click)="reject(r)">Rejeter</button>
                        </ng-container>
                        <span *ngIf="!isNutriflowAdminCreditVerifiableStatus(r.status)" class="text-muted small">—</span>
                      </td>
                    </tr>
                    <tr *ngIf="filteredRequests.length === 0">
                      <td colspan="11" class="text-center text-muted py-5 small">Aucune demande pour ce filtre.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-hub {
        background: linear-gradient(180deg, #f8faf8 0%, #f1f5f9 100%);
        min-height: 100vh;
      }
      .max-w-prose {
        max-width: 52rem;
      }
      .hub-header {
        border-left: 4px solid #198754 !important;
      }
      .metric-pill {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }
      .metric-val {
        font-size: 1.15rem;
        font-weight: 700;
        color: #0f172a;
      }
      .metric-lbl {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #64748b;
      }
      .collapsible-more summary {
        cursor: pointer;
        list-style: none;
      }
      .collapsible-more summary::-webkit-details-marker {
        display: none;
      }
      .main-requests-scroll {
        max-height: min(70vh, 900px);
      }
    `
  ]
})
export class AdminRecyclerVerificationComponent implements OnInit, OnDestroy {
  protected readonly isNutriflowAdminCreditVerifiableStatus = (status: RequestStatus): boolean =>
    this.nfRecyclerRequests.isAdminCreditVerifiable(status);
  protected rejectNotes: Record<number, string> = {};
  protected all: RecyclerRequest[] = [];
  protected pendingList: RecyclerRequest[] = [];
  protected donorLots: DonorLotRecord[] = [];
  protected requestFilter: 'all' | 'action' | 'active' | 'closed' = 'all';

  /** Correspondance clé NutriFlow (id: / sub:) → nom affiché (API utilisateurs). */
  private nameByNutriflowKey = new Map<string, string>();

  private readonly onHubPulled = (): void => {
    this.ngZone.run(() => this.reloadFromStorage());
  };

  private readonly onRecyclerRequestsChanged = (): void => {
    this.ngZone.run(() => this.reloadFromStorage());
  };

  private readonly onDonorLots = (): void => {
    this.ngZone.run(() => this.reloadFromStorage());
  };

  private readonly onCredits = (): void => {
    this.ngZone.run(() => this.cdr.markForCheck());
  };

  private readonly onStorage = (ev: StorageEvent): void => {
    if (ev.key !== NutriflowRecyclerRequestsService.STORAGE_KEY && ev.key != null) {
      return;
    }
    this.ngZone.run(() => this.reloadFromStorage());
  };

  constructor(
    private creditsService: RecyclerCreditsService,
    private authService: AuthService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private nfDonorLots: DonorLotsService,
    private nfRecyclerRequests: NutriflowRecyclerRequestsService
  ) {}

  protected get overview(): {
    totalRequests: number;
    totalKg: number;
    listedLots: number;
    pendingAdmin: number;
    creditGrants: number;
  } {
    const totalKg = this.all.reduce((s, r) => s + (Number(r.quantityKg) || 0), 0);
    const listedLots = this.donorLots.filter((l) => l.listingStatus === 'listed').length;
    return {
      totalRequests: this.all.length,
      totalKg,
      listedLots,
      pendingAdmin: this.pendingList.length,
      creditGrants: this.creditsService.getAllLedger().length
    };
  }

  protected get activeCount(): number {
    return this.all.filter((r) => ACTIVE_REQUEST_STATUSES.includes(r.status)).length;
  }

  protected get closedCount(): number {
    return this.all.filter((r) => !ACTIVE_REQUEST_STATUSES.includes(r.status)).length;
  }

  protected get filteredRequests(): RecyclerRequest[] {
    const sorted = [...this.all].sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
    switch (this.requestFilter) {
      case 'action':
        return sorted.filter((r) => this.nfRecyclerRequests.isAdminCreditVerifiable(r.status));
      case 'active':
        return sorted.filter((r) => ACTIVE_REQUEST_STATUSES.includes(r.status));
      case 'closed':
        return sorted.filter((r) => !ACTIVE_REQUEST_STATUSES.includes(r.status));
      default:
        return sorted;
    }
  }

  /**
   * Libellé lisible pour une clé stockée (id:123, sub:…). Ne renvoie jamais la clé brute.
   */
  protected displayNameForNutriflowKey(key: string | null | undefined): string {
    if (key == null || key === '') {
      return '—';
    }
    if (key === 'local:anonymous') {
      return 'Invité';
    }
    const direct = this.nameByNutriflowKey.get(key);
    if (direct) {
      return direct;
    }
    const idMatch = /^id:(\d+)$/.exec(key);
    if (idMatch) {
      const fromId = this.nameByNutriflowKey.get(`id:${idMatch[1]}`);
      if (fromId) {
        return fromId;
      }
    }
    return 'Profil non référencé';
  }

  /** Lot donateur : libellé produit + nom donateur (sans identifiant technique). */
  protected donorLotSummary(lotId: number | null | undefined): string {
    if (lotId == null) {
      return '—';
    }
    const lot = this.donorLots.find((l) => l.id === lotId);
    if (!lot) {
      return 'Lot (données locales indisponibles)';
    }
    const who = this.displayNameForNutriflowKey(lot.donorUserKey);
    return `${lot.name} — ${who}`;
  }

  protected logistiqueCell(r: RecyclerRequest): string {
    const parts: string[] = [];
    if (r.lotCode) {
      parts.push(r.lotCode);
    }
    if (r.treatmentPlan) {
      const short =
        r.treatmentPlan.length > 40 ? `${r.treatmentPlan.slice(0, 37)}…` : r.treatmentPlan;
      parts.push(short);
    }
    if (r.pickupWindow) {
      parts.push(`Enl.: ${r.pickupWindow}`);
    }
    return parts.length ? parts.join(' · ') : '—';
  }

  protected verificationSubmittedLabel(r: RecyclerRequest): string {
    const raw = r.verificationSubmittedAt;
    if (raw == null || raw === '') {
      return '—';
    }
    const d = typeof raw === 'string' ? new Date(raw) : null;
    if (d && !Number.isNaN(d.getTime())) {
      return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    }
    return String(raw);
  }

  protected closureCell(r: RecyclerRequest): string {
    if (r.status === 'verified' && r.verifiedAt) {
      const d = new Date(r.verifiedAt);
      return Number.isNaN(d.getTime()) ? r.verifiedAt : d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    }
    if (r.status === 'verification_rejected') {
      return r.adminVerificationComment || 'Rejet';
    }
    if (r.status === 'done') {
      return 'Terminé';
    }
    return '—';
  }

  protected statusRowClass(status: RequestStatus): string {
    switch (status) {
      case 'verified':
        return 'bg-success';
      case 'available':
      case 'approved':
        return 'bg-info text-dark';
      case 'pending_verification':
        return 'bg-warning text-dark';
      case 'verification_rejected':
      case 'rejected':
        return 'bg-danger';
      case 'awaiting_donor':
      case 'pending':
        return 'bg-secondary';
      case 'done':
        return 'bg-dark';
      default:
        return 'bg-secondary';
    }
  }

  private loadUserDirectory(): void {
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        const m = new Map<string, string>();
        for (const u of users) {
          const label =
            `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || (u.email as string) || 'Utilisateur';
          if (u.idUser != null) {
            m.set(`id:${u.idUser}`, label);
          }
          const ext = u as Record<string, unknown>;
          for (const field of ['keycloakId', 'keycloakSub', 'sub', 'ssoId', 'oidcSub'] as const) {
            const val = ext[field];
            if (typeof val === 'string' && val.length > 0) {
              m.set(`sub:${val}`, label);
            }
          }
        }
        this.nameByNutriflowKey = m;
        this.cdr.markForCheck();
      },
      error: () => {
        this.nameByNutriflowKey = new Map();
        this.cdr.markForCheck();
      }
    });
  }

  /** Agrégation solde / nombre d'écritures par clé recycleur. */
  protected get creditsByUser(): { userKey: string; balance: number; entryCount: number }[] {
    const ledger = this.creditsService.getAllLedger();
    const map = new Map<string, { balance: number; entryCount: number }>();
    for (const e of ledger) {
      const cur = map.get(e.userKey) ?? { balance: 0, entryCount: 0 };
      cur.balance += e.amount;
      cur.entryCount += 1;
      map.set(e.userKey, cur);
    }
    return [...map.entries()]
      .map(([userKey, v]) => ({ userKey, balance: v.balance, entryCount: v.entryCount }))
      .sort((a, b) => b.balance - a.balance || a.userKey.localeCompare(b.userKey));
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onHubPulled);
      window.addEventListener(NutriflowRecyclerRequestsService.CHANGED_EVENT, this.onRecyclerRequestsChanged);
      window.addEventListener(DonorLotsService.MUTATED_EVENT, this.onDonorLots);
      window.addEventListener(NUTRIFLOW_CREDITS_MUTATED_EVENT, this.onCredits);
      window.addEventListener('storage', this.onStorage);
    }
    this.loadUserDirectory();
    this.reloadFromStorage();
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onHubPulled);
      window.removeEventListener(NutriflowRecyclerRequestsService.CHANGED_EVENT, this.onRecyclerRequestsChanged);
      window.removeEventListener(DonorLotsService.MUTATED_EVENT, this.onDonorLots);
      window.removeEventListener(NUTRIFLOW_CREDITS_MUTATED_EVENT, this.onCredits);
      window.removeEventListener('storage', this.onStorage);
    }
  }

  protected requestStatusBadge(status: RequestStatus): string {
    const labels: Partial<Record<RequestStatus, string>> = {
      awaiting_donor: 'Att. donateur',
      pending: 'Pending',
      approved: 'Approuvé',
      available: 'Dispo.',
      pending_verification: 'Att. admin',
      verified: 'Vérifié',
      verification_rejected: 'Rejet vérif.',
      done: 'Terminé',
      rejected: 'Refusé'
    };
    return labels[status] ?? status;
  }

  approve(r: RecyclerRequest): void {
    this.reloadFromStorage();
    if (!this.nfRecyclerRequests.isAdminCreditVerifiable(r.status)) {
      return;
    }
    const userKey = r.recyclerUserKey ?? 'local:anonymous';
    this.all = this.all.map((x) =>
      x.id === r.id && this.nfRecyclerRequests.isAdminCreditVerifiable(x.status)
        ? {
            ...x,
            status: 'verified',
            verifiedAt: new Date().toISOString(),
            adminVerificationComment: undefined
          }
        : x
    );
    this.creditsService.grantForVerifiedRequest(userKey, r.id);
    this.nfRecyclerRequests.saveAll(this.all);
    this.reloadFromStorage();
  }

  reject(r: RecyclerRequest): void {
    this.reloadFromStorage();
    if (!this.nfRecyclerRequests.isAdminCreditVerifiable(r.status)) {
      return;
    }
    const note = (this.rejectNotes[r.id] ?? '').trim() || 'Rejected by administrator';
    this.all = this.all.map((x) =>
      x.id === r.id && this.nfRecyclerRequests.isAdminCreditVerifiable(x.status)
        ? {
            ...x,
            status: 'verification_rejected',
            adminVerificationComment: note,
            verifiedAt: undefined
          }
        : x
    );
    this.nfRecyclerRequests.saveAll(this.all);
    delete this.rejectNotes[r.id];
    this.reloadFromStorage();
  }

  private reloadFromStorage(): void {
    this.all = this.nfRecyclerRequests.getAll();
    this.donorLots = [...this.nfDonorLots.getAll()].sort((a, b) => b.id - a.id);
    this.pendingList = this.all
      .filter((r) => this.nfRecyclerRequests.isAdminCreditVerifiable(r.status))
      .sort(
        (a, b) =>
          (b.verificationSubmittedAt ?? '').localeCompare(a.verificationSubmittedAt ?? '')
      );
    this.cdr.markForCheck();
  }
}
