import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  isNutriflowAdminCreditVerifiableStatus,
  loadRecyclerRequests,
  RECYCLER_REQUESTS_CHANGED_EVENT,
  RecyclableProduct,
  RecyclerRequest,
  RequestStatus,
  saveRecyclerRequests
} from '../storage/recycler-operations.storage';
import {
  DONOR_LOT_PRODUCT_ID_BASE,
  DONOR_LOTS_MUTATED_EVENT,
  DonorLotRecord,
  loadAllDonorLots,
  loadListedDonorLotsForRecycler,
  saveAllDonorLots
} from '../storage/donor-lots.storage';
import { RecyclerCreditsService } from '../services/recycler-credits.service';
import { NUTRIFLOW_HUB_PULLED_EVENT } from '../services/nutriflow-hub-sync.service';
import { AuthService } from '../../gestion-user/services/auth.service';
import { RecyclerRequestsStatsPanelComponent } from './recycler-requests-stats-panel.component';
import { NutriflowRecyclerPlanetStairsComponent } from './nutriflow-recycler-planet-stairs.component';

@Component({
  selector: 'app-recycler-requests',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    NgClass,
    FormsModule,
    DecimalPipe,
    DatePipe,
    RecyclerRequestsStatsPanelComponent,
    NutriflowRecyclerPlanetStairsComponent
  ],
  template: `
    <section class="page-shell">
      <header class="hero hero--top" aria-label="Résumé NutriFlow">
        <div class="hero-intro">
          <p class="eyebrow">{{ isAdminUser ? 'Admin — inventaire NutriFlow' : 'Recycler Front Office' }}</p>
          <h2>Demandes de recyclage — lots donateurs</h2>
          <p class="subtitle" *ngIf="isRecyclerCreditsUser">
            Produits proposés par les <strong>donateurs</strong> (lots publiés). Les demandes sur lot donateur restent
            <strong>en attente donateur</strong> jusqu’à acceptation, puis validation admin et vos
            <strong>crédits fidélité</strong>.
          </p>
          <p class="subtitle" *ngIf="!isRecyclerCreditsUser">
            Vue administrateur : lots donateurs et demandes. Les <strong>crédits NutriFlow</strong> sont réservés aux
            comptes recycleur (pas au back-office).
          </p>
        </div>
        <div class="hero-metrics">
          <article>
            <span>Available inventory</span>
            <strong>{{ totalAvailableKg | number: '1.0-0' }} kg</strong>
          </article>
          <article>
            <span>Open requests</span>
            <strong>{{ openRequestsCount }}</strong>
          </article>
          <article>
            <span>Completed</span>
            <strong>{{ doneRequestsCount }}</strong>
          </article>
          <article *ngIf="isRecyclerCreditsUser">
            <span>Mes crédits</span>
            <strong>{{ creditsService.getBalance() }}</strong>
          </article>
        </div>
      </header>

      <app-recycler-requests-stats-panel *ngIf="isAdminUser" />

      <section *ngIf="isAdminUser" class="admin-requests-panel">
        <h2 class="admin-requests-title">Demandes recycleurs</h2>
        <p class="admin-requests-hint small">
          <strong>Valider</strong> lorsque la demande est <strong>Dispo.</strong> (lot accepté par le donateur),
          <strong>Approuvé</strong> ou <strong>Vérif. admin</strong> : passage en vérifié et
          <strong>+1 crédit fidélité</strong> pour le recycleur (idempotent par n° de demande).
        </p>
        <div class="table-wrap admin-requests-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Statut</th>
                <th>Produit</th>
                <th class="numeric">kg</th>
                <th>Recycleur</th>
                <th>Donateur</th>
                <th>Demandé</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of adminRequestsSorted; trackBy: trackByRequestId">
                <td>
                  <span [ngClass]="['req-status-badge', adminRequestStatusClass(r.status)]">{{
                    adminRequestStatusLabel(r.status)
                  }}</span>
                </td>
                <td>{{ r.productName }}</td>
                <td class="numeric">{{ r.quantityKg }}</td>
                <td>{{ displayNameForNutriflowKey(r.recyclerUserKey) }}</td>
                <td>{{ displayNameForNutriflowKey(r.donorUserKey) }}</td>
                <td>{{ r.requestedAt | date : 'short' }}</td>
                <td class="actions admin-request-actions">
                  <ng-container *ngIf="isNutriflowAdminCreditVerifiableStatus(r.status)">
                    <input
                      type="text"
                      class="reject-note"
                      [(ngModel)]="adminRejectNotes[r.id]"
                      [ngModelOptions]="{ standalone: true }"
                      placeholder="Motif si rejet"
                    />
                    <button type="button" class="success" (click)="adminApproveRequest(r)">Valider (crédit)</button>
                    <button type="button" class="secondary" (click)="adminRejectRequest(r)">Rejeter</button>
                  </ng-container>
                  <span *ngIf="!isNutriflowAdminCreditVerifiableStatus(r.status)" class="muted">—</span>
                </td>
              </tr>
              <tr *ngIf="adminRequestsSorted.length === 0">
                <td colspan="7" class="empty">Aucune demande enregistrée.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section *ngIf="isAdminUser" class="admin-donor-lots-panel">
        <h2 class="admin-donor-title">Lots donateurs</h2>
        <div class="table-wrap admin-donor-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>kg</th>
                <th>Lieu</th>
                <th>Visibilité</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let lot of allDonorLotsAdmin; trackBy: trackByDonorLotId">
                <td>{{ lot.name }}</td>
                <td>{{ lot.category }}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    class="kg-input"
                    [(ngModel)]="lot.quantityKg"
                    (blur)="adminPersistDonorLotRow(lot)"
                  />
                </td>
                <td>{{ lot.location }}</td>
                <td>
                  <span class="badge" [ngClass]="lot.listingStatus === 'listed' ? 'badge-listed' : 'badge-paused'">
                    {{ lot.listingStatus === 'listed' ? 'Listé' : 'Pausé' }}
                  </span>
                </td>
                <td class="actions">
                  <button type="button" class="secondary" (click)="adminToggleDonorLotListing(lot)">
                    {{ lot.listingStatus === 'listed' ? 'Paus' : 'Lister' }}
                  </button>
                  <button type="button" class="danger" (click)="adminDeleteDonorLot(lot)">Suppr.</button>
                </td>
              </tr>
              <tr *ngIf="allDonorLotsAdmin.length === 0">
                <td colspan="6" class="empty">Aucun lot donateur en stockage local.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div
        class="workspace-main-column"
        [class.workspace-main-column--recycler-split]="isRecyclerCreditsUser"
      >
        <app-nutriflow-recycler-planet-stairs
          *ngIf="isRecyclerCreditsUser"
          class="workspace-col workspace-col--game"
        />
        <div class="workspace-col workspace-col--form">
          <div class="layout-grid layout-grid-single">
            <article class="card card-request">
              <h3>Create Request</h3>
              <p *ngIf="requestSubmitError" class="alert alert-warning" style="margin:0 0 0.75rem;padding:0.5rem 0.65rem;border-radius:8px;font-size:0.85rem;">
                {{ requestSubmitError }}
              </p>
              <form class="request-form" (ngSubmit)="createRequest()">
                <p *ngIf="isAdminUser && assigneeDirectoryError" class="alert alert-warning" style="margin:0;padding:0.5rem 0.65rem;border-radius:8px;font-size:0.85rem;">
                  Impossible de charger l’annuaire utilisateurs — attribution recycleur/donateur indisponible.
                </p>

                <label *ngIf="isAdminUser">
                  Assigner au recycleur
                  <select name="assignRecyclerUserId" [(ngModel)]="draft.assignRecyclerUserId" required>
                    <option [ngValue]="null" disabled>Sélectionnez un compte recycleur</option>
                    <option *ngFor="let r of recyclersForAssign" [ngValue]="r.idUser">
                      {{ userDirectoryLabel(r) }}
                    </option>
                  </select>
                </label>

                <label *ngIf="isAdminUser">
                  Donateur (filtre des lots)
                  <select
                    name="filterDonorUserId"
                    [(ngModel)]="draft.filterDonorUserId"
                    (ngModelChange)="onAdminDonorFilterChange()"
                  >
                    <option [ngValue]="null">Tous les donateurs</option>
                    <option *ngFor="let d of donorsForAssign" [ngValue]="d.idUser">
                      {{ userDirectoryLabel(d) }}
                    </option>
                  </select>
                </label>

                <label>
                  Lot donateur disponible
                  <select
                    name="productId"
                    [(ngModel)]="draft.productId"
                    (ngModelChange)="onProductPickChange()"
                    required
                  >
                    <option [ngValue]="null" disabled>Sélectionnez un lot publié</option>
                    <option *ngFor="let p of requestableProducts; trackBy: trackByProductRow" [ngValue]="p.id">
                      {{ productOptionLabel(p) }}
                    </option>
                  </select>
                </label>
                <div *ngIf="selectedProductWithAi() as sp" class="donor-lot-ai-preview">
                  <p class="donor-lot-ai-preview__title">Aperçu donateur (analyse photo)</p>
                  <p *ngIf="sp.donorAiDescription" class="donor-lot-ai-preview__desc small mb-2">{{ sp.donorAiDescription }}</p>
                  <ng-container *ngIf="sp.donorAiRecyclablePercent != null">
                    <div class="d-flex justify-content-between align-items-baseline small mb-1">
                      <span>Recyclable</span><strong>{{ sp.donorAiRecyclablePercent }}&nbsp;%</strong>
                    </div>
                    <div class="progress thin mb-2" style="height: 6px">
                      <div class="progress-bar bg-success" [style.width.%]="sp.donorAiRecyclablePercent"></div>
                    </div>
                    <div class="d-flex justify-content-between align-items-baseline small mb-1">
                      <span>Organique</span><strong>{{ sp.donorAiOrganicPercent ?? 0 }}&nbsp;%</strong>
                    </div>
                    <div class="progress thin mb-0 bg-light" style="height: 6px">
                      <div
                        class="progress-bar bg-secondary"
                        [style.width.%]="sp.donorAiOrganicPercent ?? 0"
                      ></div>
                    </div>
                  </ng-container>
                  <ul *ngIf="sp.donorAiFilieres?.length" class="donor-lot-ai-preview__fil small mb-0">
                    <li *ngFor="let line of sp.donorAiFilieres">{{ line }}</li>
                  </ul>
                </div>

                <label>
                  Quantity (kg)
                  <input name="quantityKg" type="number" min="1" [(ngModel)]="draft.quantityKg" required />
                </label>

                <label>
                  Note
                  <textarea
                    name="note"
                    rows="3"
                    maxlength="160"
                    [(ngModel)]="draft.note"
                    placeholder="Example: Weekly collection for neighborhood center"
                  ></textarea>
                </label>

                <button type="submit">Submit Request</button>
              </form>
            </article>
          </div>
        </div>

        <article class="card recycler-credit-history" *ngIf="isRecyclerCreditsUser">
            <h3>Credit history</h3>
            <div class="table-wrap" *ngIf="creditsService.getLedgerForUser().length > 0; else noCredits">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of creditsService.getLedgerForUser()">
                    <td>{{ row.createdAt | date: 'short' }}</td>
                    <td>{{ row.amount > 0 ? '+' : '' }}{{ row.amount }}</td>
                    <td>{{ row.note || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ng-template #noCredits>
              <p class="empty">No credits yet.</p>
            </ng-template>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .page-shell {
      display: grid;
      gap: 1rem;
      max-width: 76rem;
      margin-inline: auto;
      padding-inline: clamp(0.75rem, 2.5vw, 1.5rem);
      padding-block-end: 1.5rem;
      box-sizing: border-box;
    }

    .donor-lot-ai-preview {
      margin-top: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      border: 1px solid rgba(25, 135, 84, 0.28);
      background: rgba(25, 135, 84, 0.07);
    }

    .donor-lot-ai-preview__title {
      font-size: 0.8rem;
      font-weight: 600;
      margin: 0 0 0.35rem;
      color: #166534;
    }

    .donor-lot-ai-preview__fil {
      margin-top: 0.5rem;
      padding-left: 1.1rem;
    }

    .workspace-main-column {
      display: grid;
      gap: 1rem;
      min-width: 0;
      max-width: min(42rem, 100%);
    }

    .workspace-main-column--recycler-split {
      max-width: none;
      width: 100%;
      grid-template-columns: minmax(260px, 1fr) minmax(300px, 1.12fr);
      align-items: stretch;
    }

    .workspace-main-column--recycler-split .workspace-col--game {
      min-width: 0;
    }

    .workspace-main-column--recycler-split .workspace-col--form {
      min-width: 0;
    }

    .workspace-main-column--recycler-split .recycler-credit-history {
      grid-column: 1 / -1;
    }

    @media (max-width: 991px) {
      .workspace-main-column--recycler-split {
        grid-template-columns: 1fr;
      }
    }

    .hero.hero--top {
      align-items: flex-start;
    }

    .hero.hero--top .subtitle {
      max-width: 42rem;
      font-size: 0.88rem;
    }

    .admin-requests-panel {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 1rem 1.1rem;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.04);
      margin-bottom: 0;
    }

    .admin-requests-title {
      margin: 0 0 0.35rem;
      font-size: 1rem;
      color: #111827;
    }

    .admin-requests-hint {
      margin: 0 0 0.75rem;
      color: #64748b;
      line-height: 1.4;
    }

    .admin-requests-table-wrap {
      max-height: min(55vh, 480px);
      overflow: auto;
    }

    .admin-requests-table-wrap th.numeric,
    .admin-requests-table-wrap td.numeric {
      text-align: right;
    }

    .admin-request-actions {
      flex-direction: column;
      align-items: stretch;
      gap: 0.35rem;
      min-width: 8.5rem;
    }

    .admin-request-actions .reject-note {
      width: 100%;
      font-size: 0.8rem;
      padding: 0.35rem 0.45rem;
    }

    .req-status-badge {
      display: inline-flex;
      border-radius: 999px;
      padding: 0.14rem 0.45rem;
      font-size: 0.72rem;
      font-weight: 600;
      border: 1px solid transparent;
    }

    .req-status--awaiting_donor { background: #e7e5e4; color: #44403c; }
    .req-status--pending { background: #fef9c3; color: #854d0e; }
    .req-status--approved { background: #dbeafe; color: #1e40af; }
    .req-status--available { background: #d1fae5; color: #065f46; }
    .req-status--pending_verification { background: #fef3c7; color: #92400e; }
    .req-status--verified { background: #d1fae5; color: #047857; }
    .req-status--verification_rejected { background: #ffe4e6; color: #9f1239; }
    .req-status--done { background: #e5e7eb; color: #374151; }
    .req-status--rejected { background: #fee2e2; color: #991b1b; }

    button.success {
      background: #059669;
      border-color: #059669;
      color: #fff;
    }

    button.success:hover:not(:disabled) {
      background: #047857;
    }

    .admin-donor-lots-panel {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 14px;
      padding: 1rem 1.1rem;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.04);
      margin-bottom: 0;
    }

    .admin-donor-title {
      margin: 0 0 0.35rem;
      font-size: 1rem;
      color: #92400e;
    }

    .admin-donor-table-wrap {
      max-height: 280px;
      overflow: auto;
    }

    .admin-donor-table-wrap .kg-input {
      width: 5rem;
      padding: 0.25rem 0.4rem;
      border: 1px solid #d6d3d1;
      border-radius: 6px;
      font-size: 0.85rem;
    }

    .badge-listed {
      background: #dcfce7;
      color: #166534;
      border-radius: 999px;
      padding: 0.12rem 0.45rem;
      font-size: 0.72rem;
    }

    .badge-paused {
      background: #e7e5e4;
      color: #44403c;
      border-radius: 999px;
      padding: 0.12rem 0.45rem;
      font-size: 0.72rem;
    }

    .hero {
      background: linear-gradient(135deg, #064e3b, #065f46);
      border-radius: 16px;
      color: #ecfdf5;
      padding: 1.2rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .hero.hero--top .hero-metrics {
      flex: 1;
      min-width: min(100%, 320px);
    }

    .eyebrow {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.72rem;
      color: #bbf7d0;
    }

    h2 {
      margin: 0.3rem 0;
      font-size: 1.35rem;
    }

    .hero .hero-intro h2 {
      font-size: 1.15rem;
      line-height: 1.35;
    }

    .subtitle {
      margin: 0;
      color: #d1fae5;
      max-width: 680px;
      line-height: 1.4;
      font-size: 0.93rem;
    }

    .hero-metrics {
      display: grid;
      gap: 0.6rem;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    }

    .hero-metrics article {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 10px;
      padding: 0.55rem 0.7rem;
      min-width: 120px;
    }

    .hero-metrics span {
      display: block;
      font-size: 0.74rem;
      color: #a7f3d0;
      margin-bottom: 0.25rem;
    }

    .hero-metrics strong {
      font-size: 1rem;
      color: #ffffff;
    }

    .layout-grid {
      display: grid;
      grid-template-columns: 1.8fr 1fr;
      gap: 1rem;
    }

    .layout-grid-single {
      grid-template-columns: 1fr;
      max-width: 100%;
    }

    .card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 1rem;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.04);
    }

    h3 {
      margin: 0 0 0.8rem;
      font-size: 1rem;
      color: #111827;
    }

    input,
    select,
    textarea,
    button {
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 0.52rem 0.6rem;
      font-size: 0.9rem;
      font-family: inherit;
    }

    button {
      cursor: pointer;
      background: #065f46;
      color: #fff;
      border-color: #065f46;
      transition: background 0.2s ease;
    }

    button:hover {
      background: #064e3b;
    }

    button.secondary {
      background: #f3f4f6;
      color: #111827;
      border-color: #d1d5db;
    }

    button.secondary:hover {
      background: #e5e7eb;
    }

    button.danger {
      background: #dc2626;
      border-color: #dc2626;
      color: #ffffff;
    }

    button.danger:hover {
      background: #b91c1c;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .table-wrap {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th,
    td {
      text-align: left;
      padding: 0.6rem;
      border-bottom: 1px solid #e5e7eb;
      font-size: 0.88rem;
      vertical-align: top;
    }

    .empty {
      text-align: center;
      color: #6b7280;
      padding: 1rem;
    }

    .thumb {
      width: 56px;
      height: 42px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid #d1d5db;
      display: block;
    }

    .muted {
      color: #6b7280;
      font-size: 0.8rem;
    }

    .badge {
      display: inline-flex;
      border-radius: 999px;
      padding: 0.16rem 0.5rem;
      font-size: 0.75rem;
      text-transform: capitalize;
      border: 1px solid transparent;
    }

    .text-success { color: #047857; }
    .text-danger { color: #b91c1c; }

    .request-form {
      display: grid;
      gap: 0.7rem;
    }

    .request-form label {
      display: grid;
      gap: 0.35rem;
      font-size: 0.85rem;
      color: #374151;
    }

    .actions {
      display: flex;
      gap: 0.45rem;
    }

    @media (max-width: 1024px) {
      .layout-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 720px) {
      .hero-metrics {
        width: 100%;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      }
    }
  `]
})
export class RecyclerRequestsComponent implements OnInit, OnDestroy {
  /** Exposé au template pour les actions admin (crédit). */
  protected readonly isNutriflowAdminCreditVerifiableStatus = isNutriflowAdminCreditVerifiableStatus;

  protected products: RecyclableProduct[] = [];
  protected requests: RecyclerRequest[] = loadRecyclerRequests();

  /** Annuaire API (attribution admin). */
  protected directoryUsers: any[] = [];
  protected assigneeDirectoryError = false;
  private nameByNutriflowKey = new Map<string, string>();

  protected draft: {
    productId: number | null;
    quantityKg: number;
    note: string;
    assignRecyclerUserId: number | null;
    filterDonorUserId: number | null;
  } = {
    productId: null,
    quantityKg: 1,
    note: '',
    assignRecyclerUserId: null,
    filterDonorUserId: null
  };

  protected requestSubmitError = '';
  /** Motif rejet admin (clé = id demande). */
  protected adminRejectNotes: Record<number, string> = {};
  /** Tous les lots donateurs (admin) — édition locale. */
  protected allDonorLotsAdmin: DonorLotRecord[] = [];
  private nextRequestId = this.requests.length > 0
    ? Math.max(...this.requests.map((entry) => entry.id)) + 1
    : 1001;

  private readonly onHubPulled = (): void => {
    this.ngZone.run(() => this.refreshFromStorage());
  };

  private readonly onDonorLotsMutated = (): void => {
    this.ngZone.run(() => this.refreshFromStorage());
  };

  private readonly onRecyclerRequestsExternalChange = (): void => {
    this.ngZone.run(() => this.refreshFromStorage());
  };

  constructor(
    protected creditsService: RecyclerCreditsService,
    protected authService: AuthService,
    private ngZone: NgZone
  ) {}

  get isAdminUser(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  /** Recycleur « pur » : crédits, fidélité et journal (pas les comptes admin). */
  get isRecyclerCreditsUser(): boolean {
    return this.authService.hasRole('RECYCLER') && !this.authService.hasRole('ADMIN');
  }

  ngOnInit(): void {
    this.refreshFromStorage();
    this.loadAssigneeDirectory();
    if (this.authService.isLoggedIn() && !this.authService.getCurrentUser()) {
      this.authService.fetchUserProfile().subscribe({
        next: () => this.ngZone.run(() => this.refreshFromStorage()),
        error: () => this.ngZone.run(() => this.refreshFromStorage())
      });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onHubPulled);
      window.addEventListener(DONOR_LOTS_MUTATED_EVENT, this.onDonorLotsMutated);
      window.addEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, this.onRecyclerRequestsExternalChange);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onHubPulled);
      window.removeEventListener(DONOR_LOTS_MUTATED_EVENT, this.onDonorLotsMutated);
      window.removeEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, this.onRecyclerRequestsExternalChange);
    }
  }

  private refreshFromStorage(): void {
    this.requests = loadRecyclerRequests();
    this.products = this.getProductsFromAdmin();
    this.allDonorLotsAdmin = [...loadAllDonorLots()].sort((a, b) => b.id - a.id);
    this.nextRequestId =
      this.requests.length > 0 ? Math.max(...this.requests.map((entry) => entry.id)) + 1 : 1001;
  }

  /** Liste admin : demandes les plus récentes d’abord. */
  protected get adminRequestsSorted(): RecyclerRequest[] {
    return [...this.requests].sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  protected trackByRequestId(_: number, r: RecyclerRequest): number {
    return r.id;
  }

  protected adminRequestStatusLabel(status: RequestStatus): string {
    const labels: Partial<Record<RequestStatus, string>> = {
      awaiting_donor: 'Att. donateur',
      pending: 'En attente',
      approved: 'Approuvé',
      available: 'Dispo.',
      pending_verification: 'Vérif. admin',
      verified: 'Vérifié',
      verification_rejected: 'Rejet vérif.',
      done: 'Terminé',
      rejected: 'Refusé'
    };
    return labels[status] ?? status;
  }

  protected adminRequestStatusClass(status: RequestStatus): string {
    return `req-status--${status}`;
  }

  /** Aligné sur <code>AdminRecyclerVerificationComponent.approve</code>. */
  protected adminApproveRequest(r: RecyclerRequest): void {
    if (!isNutriflowAdminCreditVerifiableStatus(r.status)) {
      return;
    }
    this.refreshFromStorage();
    const userKey = r.recyclerUserKey ?? 'local:anonymous';
    this.requests = this.requests.map((x) =>
      x.id === r.id && isNutriflowAdminCreditVerifiableStatus(x.status)
        ? {
            ...x,
            status: 'verified',
            verifiedAt: new Date().toISOString(),
            adminVerificationComment: undefined
          }
        : x
    );
    this.creditsService.grantForVerifiedRequest(userKey, r.id);
    this.persistRequests();
    this.refreshFromStorage();
  }

  protected adminRejectRequest(r: RecyclerRequest): void {
    if (!isNutriflowAdminCreditVerifiableStatus(r.status)) {
      return;
    }
    this.refreshFromStorage();
    const note = (this.adminRejectNotes[r.id] ?? '').trim() || 'Rejet administrateur';
    this.requests = this.requests.map((x) =>
      x.id === r.id && isNutriflowAdminCreditVerifiableStatus(x.status)
        ? {
            ...x,
            status: 'verification_rejected',
            adminVerificationComment: note,
            verifiedAt: undefined
          }
        : x
    );
    delete this.adminRejectNotes[r.id];
    this.persistRequests();
    this.refreshFromStorage();
  }

  protected get recyclersForAssign(): any[] {
    return this.directoryUsers.filter(
      (u: any) =>
        this.normUserRole(u.role) === 'RECYCLER' &&
        u.idUser != null &&
        this.recyclerStorageKeyForUser(u) !== 'local:anonymous'
    );
  }

  protected get donorsForAssign(): any[] {
    return this.directoryUsers.filter(
      (u: any) => this.normUserRole(u.role) === 'DONOR' && u.idUser != null
    );
  }

  protected get requestableProducts(): RecyclableProduct[] {
    let list = this.products.filter((p) => p.status !== 'done' && p.availableKg > 0 && p.donorLotId != null);
    if (this.isAdminUser && this.draft.filterDonorUserId != null) {
      const donor = this.directoryUsers.find((u) => u.idUser === this.draft.filterDonorUserId);
      if (donor) {
        const allowed = new Set(this.nutriflowStorageKeysForUser(donor));
        list = list.filter((p) => p.donorUserKey != null && allowed.has(p.donorUserKey));
      }
    }
    return list;
  }

  protected onProductPickChange(): void {}

  /** Lot sélectionné dans le formulaire, si l’offre contient une analyse IA à montrer au recycleur. */
  protected selectedProductWithAi(): RecyclableProduct | null {
    const id = this.draft.productId;
    if (id == null) {
      return null;
    }
    const p = this.requestableProducts.find((x) => x.id === id);
    if (!p) {
      return null;
    }
    const hasData =
      p.donorAiRecyclablePercent != null ||
      (p.donorAiFilieres != null && p.donorAiFilieres.length > 0) ||
      !!p.donorAiDescription?.trim();
    return hasData ? p : null;
  }

  protected userDirectoryLabel(u: { prenom?: string; nom?: string; email?: string }): string {
    const name = `${u.prenom ?? ''} ${u.nom ?? ''}`.trim();
    return name || (u.email as string) || 'Utilisateur';
  }

  protected productOptionLabel(p: RecyclableProduct): string {
    const donor = p.donorUserKey ? this.displayNameForNutriflowKey(p.donorUserKey) : '—';
    return `${p.name} — ${donor} · ${p.availableKg} kg`;
  }

  /**
   * Libellé pour une clé NutriFlow (id: / sub:), aligné sur le hub admin.
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

  protected onAdminDonorFilterChange(): void {
    this.draft.productId = null;
  }

  private loadAssigneeDirectory(): void {
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        this.ngZone.run(() => {
          this.directoryUsers = users ?? [];
          this.rebuildNutriflowNameMap();
          this.assigneeDirectoryError = false;
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.directoryUsers = [];
          this.nameByNutriflowKey.clear();
          this.assigneeDirectoryError = true;
        });
      }
    });
  }

  private rebuildNutriflowNameMap(): void {
    const m = new Map<string, string>();
    for (const u of this.directoryUsers) {
      const row = u as Record<string, unknown>;
      const label = this.userDirectoryLabel(u);
      if (u.idUser != null) {
        m.set(`id:${u.idUser}`, label);
      }
      for (const field of ['keycloakId', 'keycloakSub', 'sub', 'ssoId', 'oidcSub'] as const) {
        const val = row[field];
        if (typeof val === 'string' && val.length > 0) {
          m.set(`sub:${val}`, label);
        }
      }
    }
    this.nameByNutriflowKey = m;
  }

  private normUserRole(role: unknown): string {
    return String(role ?? '')
      .toUpperCase()
      .replace(/^ROLE_/, '');
  }

  /** Toutes les clés pouvant correspondre à <code>donorUserKey</code> sur un lot. */
  private nutriflowStorageKeysForUser(u: any): string[] {
    const row = u as Record<string, unknown>;
    const keys: string[] = [];
    if (u.idUser != null) {
      keys.push(`id:${u.idUser}`);
    }
    for (const field of ['keycloakId', 'keycloakSub', 'sub', 'ssoId', 'oidcSub'] as const) {
      const val = row[field];
      if (typeof val === 'string' && val.length > 0) {
        keys.push(`sub:${val}`);
      }
    }
    return keys;
  }

  /** Clé enregistrée sur la demande (même règle que <code>AuthService.getCreditsUserKey</code>). */
  private recyclerStorageKeyForUser(u: any): string {
    const row = u as Record<string, unknown>;
    if (u.idUser != null) {
      return `id:${u.idUser}`;
    }
    for (const field of ['keycloakId', 'keycloakSub', 'sub', 'ssoId', 'oidcSub'] as const) {
      const val = row[field];
      if (typeof val === 'string' && val.length > 0) {
        return `sub:${val}`;
      }
    }
    return 'local:anonymous';
  }

  trackByProductRow(_: number, p: RecyclableProduct): string {
    return p.donorLotId != null ? `d:${p.donorLotId}` : `c:${p.id}`;
  }

  trackByDonorLotId(_: number, lot: DonorLotRecord): number {
    return lot.id;
  }

  protected adminPersistDonorLotRow(lot: DonorLotRecord): void {
    const lots = loadAllDonorLots();
    const idx = lots.findIndex((l) => l.id === lot.id);
    if (idx < 0) {
      return;
    }
    const q = Math.max(0, Math.floor(Number(lot.quantityKg) || 0));
    lots[idx] = { ...lots[idx], quantityKg: q };
    saveAllDonorLots(lots);
    this.refreshFromStorage();
  }

  protected adminToggleDonorLotListing(lot: DonorLotRecord): void {
    const lots = loadAllDonorLots();
    const idx = lots.findIndex((l) => l.id === lot.id);
    if (idx < 0) {
      return;
    }
    const next: DonorLotRecord['listingStatus'] =
      lots[idx].listingStatus === 'listed' ? 'paused' : 'listed';
    lots[idx] = { ...lots[idx], listingStatus: next };
    saveAllDonorLots(lots);
    this.refreshFromStorage();
  }

  protected adminDeleteDonorLot(lot: DonorLotRecord): void {
    if (!confirm('Supprimer ce lot du stockage NutriFlow (local) ?')) {
      return;
    }
    const lots = loadAllDonorLots().filter((l) => l.id !== lot.id);
    saveAllDonorLots(lots);
    this.refreshFromStorage();
  }

  protected get totalAvailableKg(): number {
    return this.products.reduce((sum, p) => sum + p.availableKg, 0);
  }

  protected get openRequestsCount(): number {
    const key = this.creditsService.getCurrentRecyclerKey();
    const scope = this.isAdminUser
      ? this.requests
      : this.requests.filter((r) => !r.recyclerUserKey || r.recyclerUserKey === key);
    return scope.filter((r) =>
      ['awaiting_donor', 'pending', 'approved', 'available', 'pending_verification'].includes(r.status)
    ).length;
  }

  protected get doneRequestsCount(): number {
    const key = this.creditsService.getCurrentRecyclerKey();
    const scope = this.isAdminUser
      ? this.requests
      : this.requests.filter((r) => !r.recyclerUserKey || r.recyclerUserKey === key);
    return scope.filter((r) => r.status === 'done' || r.status === 'verified').length;
  }

  protected createRequest(): void {
    this.requestSubmitError = '';
    this.products = this.getProductsFromAdmin();
    this.requests = loadRecyclerRequests();
    this.nextRequestId =
      this.requests.length > 0 ? Math.max(...this.requests.map((entry) => entry.id)) + 1 : 1001;

    if (this.isAdminUser) {
      if (this.draft.assignRecyclerUserId == null) {
        this.requestSubmitError = 'Sélectionnez le recycleur à qui attribuer la demande.';
        return;
      }
    }

    if (this.draft.productId === null) {
      this.requestSubmitError = 'Sélectionnez un lot donateur dans la liste.';
      return;
    }

    const pid = Number(this.draft.productId);
    const product = this.products.find((p) => Number(p.id) === pid);
    if (!product) {
      this.requestSubmitError = 'Produit introuvable. Rechargez la page.';
      return;
    }

    if (this.draft.quantityKg < 1 || this.draft.quantityKg > product.availableKg) {
      this.requestSubmitError = 'Quantité invalide pour ce produit.';
      return;
    }

    let recyclerUserKey = this.creditsService.getCurrentRecyclerKey();
    if (this.isAdminUser) {
      const recyclerUser = this.directoryUsers.find((u) => u.idUser === this.draft.assignRecyclerUserId);
      if (!recyclerUser) {
        this.requestSubmitError = 'Recycleur introuvable dans l’annuaire.';
        return;
      }
      recyclerUserKey = this.recyclerStorageKeyForUser(recyclerUser);
    }

    let donorLotId = product.donorLotId;
    let donorUserKey = product.donorUserKey;
    if (donorLotId != null) {
      const lotRow = loadAllDonorLots().find((l) => l.id === donorLotId);
      if (!lotRow) {
        this.requestSubmitError =
          'Lot donateur introuvable (stockage). Le donateur doit republier ou activer le hub NutriFlow (port 8095).';
        return;
      }
      if (!lotRow.donorUserKey) {
        this.requestSubmitError = 'Lot donateur invalide (propriétaire inconnu).';
        return;
      }
      donorUserKey = lotRow.donorUserKey;
      donorLotId = lotRow.id;
    }

    if (this.isAdminUser && this.draft.filterDonorUserId != null && donorUserKey) {
      const donor = this.directoryUsers.find((u) => u.idUser === this.draft.filterDonorUserId);
      if (donor) {
        const allowed = new Set(this.nutriflowStorageKeysForUser(donor));
        if (!allowed.has(donorUserKey)) {
          this.requestSubmitError = 'Le lot ne correspond pas au donateur sélectionné.';
          return;
        }
      }
    }

    const isDonorLot = donorLotId != null;
    const request: RecyclerRequest = {
      id: this.nextRequestId++,
      productId: product.id,
      productName: product.name,
      quantityKg: this.draft.quantityKg,
      note: this.draft.note.trim(),
      status: isDonorLot ? 'awaiting_donor' : product.status === 'available' ? 'available' : 'pending',
      requestedAt: new Date(),
      recyclerUserKey,
      donorUserKey: isDonorLot ? donorUserKey : undefined,
      donorLotId: isDonorLot ? donorLotId : undefined
    };

    this.requests = [request, ...this.requests];
    this.persistRequests();
    if (!isDonorLot) {
      product.availableKg = Math.max(0, product.availableKg - this.draft.quantityKg);
      if (product.availableKg === 0) {
        product.status = 'done';
      }
      this.persistProducts();
    }

    this.draft = {
      productId: null,
      quantityKg: 1,
      note: '',
      assignRecyclerUserId: null,
      filterDonorUserId: null
    };
  }

  private getProductsFromAdmin(): RecyclableProduct[] {
    return loadListedDonorLotsForRecycler().map<RecyclableProduct>((lot) => ({
      id: DONOR_LOT_PRODUCT_ID_BASE + lot.id,
      name: lot.name,
      category: lot.category,
      availableKg: lot.quantityKg,
      location: lot.location,
      status: 'available',
      imageUrl: lot.imageUrl ?? '',
      donorLotId: lot.id,
      donorUserKey: lot.donorUserKey,
      donorAiRecyclablePercent: lot.aiRecyclablePercent,
      donorAiOrganicPercent: lot.aiOrganicPercent,
      donorAiFilieres: lot.classificationFilieres,
      donorAiDescription: lot.classificationDescription
    }));
  }

  private persistProducts(): void {
    const allDonor = loadAllDonorLots();
    let donorDirty = false;
    for (const p of this.products) {
      if (p.donorLotId != null) {
        const idx = allDonor.findIndex((l) => l.id === p.donorLotId);
        if (idx >= 0 && allDonor[idx].quantityKg !== p.availableKg) {
          allDonor[idx] = { ...allDonor[idx], quantityKg: p.availableKg };
          donorDirty = true;
        }
      }
    }
    if (donorDirty) {
      saveAllDonorLots(allDonor);
    }
  }

  private persistRequests(): void {
    saveRecyclerRequests(this.requests);
  }
}
