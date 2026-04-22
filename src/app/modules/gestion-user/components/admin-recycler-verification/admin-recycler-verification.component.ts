import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  loadRecyclerRequests,
  RECYCLER_REQUESTS_CHANGED_EVENT,
  RECYCLER_REQUESTS_STORAGE_KEY,
  RecyclerRequest,
  saveRecyclerRequests
} from '../../../valorisation-organique-economie-circulaire/recycler-operations.storage';
import { RecyclerCreditsService } from '../../../valorisation-organique-economie-circulaire/services/recycler-credits.service';
import { NUTRIFLOW_HUB_PULLED_EVENT } from '../../../valorisation-organique-economie-circulaire/services/nutriflow-hub-sync.service';

@Component({
  selector: 'app-admin-recycler-verification',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, DatePipe, RouterLink],
  template: `
    <div class="container py-4">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 class="h4 mb-1 text-success">
            <i class="bi bi-patch-check me-2"></i>Validation des opérations recycleurs
          </h1>
          <p class="text-muted small mb-0">
            Chaque opération approuvée crédite le recycleur de <strong>1 point</strong> (idempotent par demande).
          </p>
          <p class="text-muted small mb-0 mt-2">
            Seules les demandes en <strong>pending_verification</strong> apparaissent ci‑dessous (après « Declare done » côté recycleur).
            Pour que <strong>donateur / recycleur / admin</strong> sur d’autres sessions voient les mêmes données, démarrez le
            <strong>NutriFlow hub</strong> sur <code>http://localhost:8095</code>
            (<code>backend-services/run-nutriflow-hub.ps1</code>).
          </p>
        </div>
        <a routerLink="/user/dashboard" class="btn btn-outline-secondary btn-sm">Retour dashboard</a>
      </div>

      <div class="alert alert-info" *ngIf="pendingList.length === 0">
        Aucune opération en attente de validation.
      </div>

      <div class="table-responsive card shadow-sm" *ngIf="pendingList.length > 0">
        <table class="table table-hover mb-0 align-middle">
          <thead class="table-light">
            <tr>
              <th>#</th>
              <th>Recycleur (clé)</th>
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
              <td>{{ r.id }}</td>
              <td><code class="small">{{ r.recyclerUserKey || '—' }}</code></td>
              <td>{{ r.productName }}</td>
              <td>{{ r.quantityKg }}</td>
              <td>{{ r.verificationSubmittedAt | date: 'short' }}</td>
              <td>{{ r.note || '—' }}</td>
              <td style="min-width: 200px">
                <input
                  type="text"
                  class="form-control form-control-sm"
                  [(ngModel)]="rejectNotes[r.id]"
                  placeholder="Si rejet : motif affiché au recycleur"
                />
              </td>
              <td class="text-nowrap">
                <button type="button" class="btn btn-success btn-sm me-1" (click)="approve(r)">
                  Approuver
                </button>
                <button type="button" class="btn btn-outline-danger btn-sm" (click)="reject(r)">
                  Rejeter
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 class="h6 mt-5 mb-3">
        <i class="bi bi-box-seam me-2 text-success"></i>Produits recyclés validés (NutriFlow)
      </h2>
      <p class="text-muted small mb-2">
        Opérations déjà <strong>approuvées</strong> (crédit recycleur attribué). Flux : demande → donateur → recycleur
        <em>Declare done</em> → <em>Approuver</em> ci‑dessus.
      </p>
      <div class="table-responsive card shadow-sm mb-4">
        <table class="table table-sm mb-0 align-middle">
          <thead class="table-light">
            <tr>
              <th>#</th>
              <th>Produit</th>
              <th>Qté (kg)</th>
              <th>Recycleur</th>
              <th>Validé le</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of verifiedNutriFlowRows">
              <td>{{ r.id }}</td>
              <td>{{ r.productName }}</td>
              <td>{{ r.quantityKg }}</td>
              <td><code class="small">{{ r.recyclerUserKey || '—' }}</code></td>
              <td>{{ r.verifiedAt | date: 'short' }}</td>
            </tr>
            <tr *ngIf="verifiedNutriFlowRows.length === 0">
              <td colspan="5" class="text-center text-muted py-4">
                Aucun produit recyclé validé pour l’instant.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 class="h6 mt-5 mb-3">Historique récent (tous statuts de vérification)</h2>
      <div class="table-responsive card shadow-sm">
        <table class="table table-sm mb-0">
          <thead class="table-light">
            <tr>
              <th>#</th>
              <th>Statut</th>
              <th>Produit</th>
              <th>Recycleur</th>
              <th>Mis à jour</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of recentVerificationRows">
              <td>{{ r.id }}</td>
              <td>
                <span class="badge" [class.bg-success]="r.status === 'verified'" [class.bg-warning]="r.status === 'pending_verification'" [class.bg-danger]="r.status === 'verification_rejected'">
                  {{ r.status }}
                </span>
              </td>
              <td>{{ r.productName }}</td>
              <td><code class="small">{{ r.recyclerUserKey || '—' }}</code></td>
              <td>{{ (r.verifiedAt || r.verificationSubmittedAt || r.requestedAt) | date: 'short' }}</td>
            </tr>
            <tr *ngIf="recentVerificationRows.length === 0">
              <td colspan="5" class="text-center text-muted py-4">Aucune donnée.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminRecyclerVerificationComponent implements OnInit, OnDestroy {
  protected rejectNotes: Record<number, string> = {};
  private all: RecyclerRequest[] = [];
  protected pendingList: RecyclerRequest[] = [];
  protected recentVerificationRows: RecyclerRequest[] = [];
  protected verifiedNutriFlowRows: RecyclerRequest[] = [];

  private readonly onHubPulled = (): void => {
    this.ngZone.run(() => this.reloadFromStorage());
  };

  private readonly onRecyclerRequestsChanged = (): void => {
    this.ngZone.run(() => this.reloadFromStorage());
  };

  private readonly onStorage = (ev: StorageEvent): void => {
    if (ev.key !== RECYCLER_REQUESTS_STORAGE_KEY && ev.key != null) {
      return;
    }
    this.ngZone.run(() => this.reloadFromStorage());
  };

  constructor(
    private creditsService: RecyclerCreditsService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onHubPulled);
      window.addEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, this.onRecyclerRequestsChanged);
      window.addEventListener('storage', this.onStorage);
    }
    this.reloadFromStorage();
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onHubPulled);
      window.removeEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, this.onRecyclerRequestsChanged);
      window.removeEventListener('storage', this.onStorage);
    }
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
