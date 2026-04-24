import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  loadRecyclerRequests,
  RECYCLER_REQUESTS_CHANGED_EVENT,
  RECYCLER_REQUESTS_STORAGE_KEY,
  RecyclerRequest,
  RequestStatus,
  saveRecyclerRequests
} from '../../../valorisation-organique-economie-circulaire/storage/recycler-operations.storage';
import {
  RecyclerCreditsService,
  NUTRIFLOW_CREDITS_MUTATED_EVENT
} from '../../../valorisation-organique-economie-circulaire/services/recycler-credits.service';
import { NUTRIFLOW_HUB_PULLED_EVENT } from '../../../valorisation-organique-economie-circulaire/services/nutriflow-hub-sync.service';
import {
  DONOR_LOTS_MUTATED_EVENT,
  DonorLotRecord,
  loadAllDonorLots
} from '../../../valorisation-organique-economie-circulaire/storage/donor-lots.storage';
import { RecyclerRequestsStatsPanelComponent } from '../../../valorisation-organique-economie-circulaire/components/recycler-requests-stats-panel.component';

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
  imports: [
    NgFor,
    NgIf,
    FormsModule,
    DatePipe,
    DecimalPipe,
    RouterLink,
    RecyclerRequestsStatsPanelComponent
  ],
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
                Vue consolidée : lots donateurs, demandes recycleurs, statistiques, crédits par utilisateur et validation des
                opérations. Hub local (port 8095) pour synchroniser les sessions.
              </p>
            </div>
            <div class="d-flex flex-wrap gap-2">
              <a routerLink="/user/dashboard" class="btn btn-outline-secondary btn-sm">Dashboard</a>
              <a routerLink="/valorisation/nutriflow" class="btn btn-outline-success btn-sm">NutriFlow recycleur</a>
              <a routerLink="/valorisation/store-requests" class="btn btn-outline-dark btn-sm">Store validation</a>
            </div>
          </div>
        </header>

        <!-- 1. Statistiques -->
        <section class="mb-4" aria-labelledby="sec-stats">
          <div class="section-label" id="sec-stats">
            <span class="section-num">1</span>
            Statistiques &amp; répartition
          </div>
          <app-recycler-requests-stats-panel />
        </section>

        <div class="row g-4 mb-4">
          <!-- 2. Lots donateurs -->
          <div class="col-lg-6">
            <section aria-labelledby="sec-lots">
              <div class="section-label" id="sec-lots">
                <span class="section-num">2</span>
                Lots valorisation (donateurs)
              </div>
              <div class="card shadow-sm border-0 h-100">
                <div class="card-body p-0">
                  <div class="table-responsive" style="max-height: 320px">
                    <table class="table table-sm table-hover mb-0 align-middle">
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
                          <td colspan="4" class="text-center text-muted py-4 small">Aucun lot en stockage local.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <!-- 3. Crédits par recycleur -->
          <div class="col-lg-6">
            <section aria-labelledby="sec-credits">
              <div class="section-label" id="sec-credits">
                <span class="section-num">3</span>
                Crédits par recycleur
              </div>
              <div class="card shadow-sm border-0 h-100">
                <div class="card-body p-0">
                  <div class="table-responsive" style="max-height: 320px">
                    <table class="table table-sm table-hover mb-0 align-middle">
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
                          <td colspan="3" class="text-center text-muted py-4 small">Aucun crédit enregistré.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p class="small text-muted mb-0 px-3 py-2 border-top bg-light">
                    +1 crédit par opération validée ci-dessous (une seule fois par demande).
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <!-- 4. Demandes recycleurs actives -->
        <section class="mb-4" aria-labelledby="sec-requests">
          <div class="section-label" id="sec-requests">
            <span class="section-num">4</span>
            Demandes recycleurs (en cours)
          </div>
          <p class="small text-muted mb-2">
            Statuts : attente donateur, pending store, approuvé, disponible, ou en attente de votre validation.
          </p>
          <div class="card shadow-sm border-0">
            <div class="card-body p-0">
              <div class="table-responsive" style="max-height: 380px">
                <table class="table table-sm table-hover mb-0 align-middle">
                  <thead class="table-light sticky-top">
                    <tr>
                      <th>Statut</th>
                      <th>Produit</th>
                      <th class="text-end">kg</th>
                      <th>Recycleur</th>
                      <th>Lot donateur</th>
                      <th>Demandé</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let r of activeRecyclerRequests">
                      <td>{{ requestStatusBadge(r.status) }}</td>
                      <td>{{ r.productName }}</td>
                      <td class="text-end">{{ r.quantityKg }}</td>
                      <td>{{ displayNameForNutriflowKey(r.recyclerUserKey) }}</td>
                      <td class="small">{{ donorLotSummary(r.donorLotId) }}</td>
                      <td class="text-nowrap small">{{ r.requestedAt | date: 'short' }}</td>
                      <td class="small text-muted">{{ r.note || '—' }}</td>
                    </tr>
                    <tr *ngIf="activeRecyclerRequests.length === 0">
                      <td colspan="7" class="text-center text-muted py-4 small">Aucune demande active.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <!-- 5. Validation admin -->
        <section class="mb-4" aria-labelledby="sec-validation">
          <div class="section-label" id="sec-validation">
            <span class="section-num">5</span>
            Validation des opérations (en attente de vérification)
          </div>
          <p class="text-muted small mb-2">
            Après « Declare done » côté recycleur. Approuver attribue le crédit (+1) de façon idempotente.
          </p>

          <div class="alert alert-info mb-3" *ngIf="pendingList.length === 0">
            Aucune opération en attente de validation.
          </div>

          <div class="card shadow-sm border-0" *ngIf="pendingList.length > 0">
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0 align-middle">
                  <thead class="table-light">
                    <tr>
                      <th>Recycleur</th>
                      <th>Produit</th>
                      <th>Qté (kg)</th>
                      <th>Soumis</th>
                      <th>Note recycleur</th>
                      <th>Commentaire admin</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let r of pendingList">
                      <td>{{ displayNameForNutriflowKey(r.recyclerUserKey) }}</td>
                      <td>{{ r.productName }}</td>
                      <td>{{ r.quantityKg }}</td>
                      <td>{{ r.verificationSubmittedAt | date: 'short' }}</td>
                      <td>{{ r.note || '—' }}</td>
                      <td style="min-width: 200px">
                        <input
                          type="text"
                          class="form-control form-control-sm"
                          [(ngModel)]="rejectNotes[r.id]"
                          placeholder="Si rejet : motif"
                        />
                      </td>
                      <td class="text-nowrap">
                        <button type="button" class="btn btn-success btn-sm me-1" (click)="approve(r)">Approuver</button>
                        <button type="button" class="btn btn-outline-danger btn-sm" (click)="reject(r)">Rejeter</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <!-- 6. Validées + historique -->
        <div class="row g-4">
          <div class="col-lg-6">
            <section aria-labelledby="sec-verified">
              <div class="section-label" id="sec-verified">
                <span class="section-num">6</span>
                Opérations validées (créditées)
              </div>
              <div class="card shadow-sm border-0">
                <div class="card-body p-0">
                  <div class="table-responsive" style="max-height: 280px">
                    <table class="table table-sm mb-0 align-middle">
                      <thead class="table-light sticky-top">
                        <tr>
                          <th>Produit</th>
                          <th>kg</th>
                          <th>Recycleur</th>
                          <th>Validé</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let r of verifiedNutriFlowRows">
                          <td>{{ r.productName }}</td>
                          <td>{{ r.quantityKg }}</td>
                          <td>{{ displayNameForNutriflowKey(r.recyclerUserKey) }}</td>
                          <td class="small">{{ r.verifiedAt | date: 'short' }}</td>
                        </tr>
                        <tr *ngIf="verifiedNutriFlowRows.length === 0">
                          <td colspan="4" class="text-center text-muted py-3 small">Aucune.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div class="col-lg-6">
            <section aria-labelledby="sec-history">
              <div class="section-label" id="sec-history">
                <span class="section-num">7</span>
                Historique vérifications (aperçu)
              </div>
              <div class="card shadow-sm border-0">
                <div class="card-body p-0">
                  <div class="table-responsive" style="max-height: 280px">
                    <table class="table table-sm mb-0">
                      <thead class="table-light sticky-top">
                        <tr>
                          <th>Statut</th>
                          <th>Produit</th>
                          <th>Recycleur</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let r of recentVerificationRows">
                          <td>
                            <span
                              class="badge"
                              [class.bg-success]="r.status === 'verified'"
                              [class.bg-warning]="r.status === 'pending_verification'"
                              [class.bg-danger]="r.status === 'verification_rejected'"
                            >
                              {{ r.status }}
                            </span>
                          </td>
                          <td class="small">{{ r.productName }}</td>
                          <td>{{ displayNameForNutriflowKey(r.recyclerUserKey) }}</td>
                          <td class="small text-nowrap">
                            {{ (r.verifiedAt || r.verificationSubmittedAt || r.requestedAt) | date: 'short' }}
                          </td>
                        </tr>
                        <tr *ngIf="recentVerificationRows.length === 0">
                          <td colspan="4" class="text-center text-muted py-3 small">Aucune.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
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
      .section-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        font-size: 0.95rem;
        color: #0f172a;
        margin-bottom: 0.5rem;
      }
      .section-num {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.65rem;
        height: 1.65rem;
        border-radius: 999px;
        background: #198754;
        color: #fff;
        font-size: 0.75rem;
        font-weight: 700;
      }
    `
  ]
})
export class AdminRecyclerVerificationComponent implements OnInit, OnDestroy {
  protected rejectNotes: Record<number, string> = {};
  private all: RecyclerRequest[] = [];
  protected pendingList: RecyclerRequest[] = [];
  protected recentVerificationRows: RecyclerRequest[] = [];
  protected verifiedNutriFlowRows: RecyclerRequest[] = [];
  protected donorLots: DonorLotRecord[] = [];
  protected activeRecyclerRequests: RecyclerRequest[] = [];

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
    if (ev.key !== RECYCLER_REQUESTS_STORAGE_KEY && ev.key != null) {
      return;
    }
    this.ngZone.run(() => this.reloadFromStorage());
  };

  constructor(
    private creditsService: RecyclerCreditsService,
    private authService: AuthService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

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
      window.addEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, this.onRecyclerRequestsChanged);
      window.addEventListener(DONOR_LOTS_MUTATED_EVENT, this.onDonorLots);
      window.addEventListener(NUTRIFLOW_CREDITS_MUTATED_EVENT, this.onCredits);
      window.addEventListener('storage', this.onStorage);
    }
    this.loadUserDirectory();
    this.reloadFromStorage();
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onHubPulled);
      window.removeEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, this.onRecyclerRequestsChanged);
      window.removeEventListener(DONOR_LOTS_MUTATED_EVENT, this.onDonorLots);
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
    const userKey = r.recyclerUserKey ?? 'local:anonymous';
    this.all = this.all.map((x) =>
      x.id === r.id && x.status === 'pending_verification'
        ? {
            ...x,
            status: 'verified',
            verifiedAt: new Date().toISOString(),
            adminVerificationComment: undefined
          }
        : x
    );
    this.creditsService.grantForVerifiedRequest(userKey, r.id);
    saveRecyclerRequests(this.all);
    this.reloadFromStorage();
  }

  reject(r: RecyclerRequest): void {
    this.reloadFromStorage();
    const note = (this.rejectNotes[r.id] ?? '').trim() || 'Rejected by administrator';
    this.all = this.all.map((x) =>
      x.id === r.id && x.status === 'pending_verification'
        ? {
            ...x,
            status: 'verification_rejected',
            adminVerificationComment: note,
            verifiedAt: undefined
          }
        : x
    );
    saveRecyclerRequests(this.all);
    delete this.rejectNotes[r.id];
    this.reloadFromStorage();
  }

  private reloadFromStorage(): void {
    this.all = loadRecyclerRequests();
    this.donorLots = [...loadAllDonorLots()].sort((a, b) => b.id - a.id);

    this.activeRecyclerRequests = this.all
      .filter((r) => ACTIVE_REQUEST_STATUSES.includes(r.status))
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());

    this.pendingList = this.all
      .filter((r) => r.status === 'pending_verification')
      .sort(
        (a, b) =>
          (b.verificationSubmittedAt ?? '').localeCompare(a.verificationSubmittedAt ?? '')
      );
    this.recentVerificationRows = this.all
      .filter((r) =>
        ['pending_verification', 'verified', 'verification_rejected'].includes(r.status)
      )
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())
      .slice(0, 40);
    this.verifiedNutriFlowRows = this.all
      .filter((r) => r.status === 'verified')
      .sort((a, b) => (b.verifiedAt ?? '').localeCompare(a.verifiedAt ?? ''))
      .slice(0, 200);
    this.cdr.markForCheck();
  }
}
