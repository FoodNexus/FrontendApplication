import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass, NgFor, NgIf, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  loadRecyclerRequests,
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
    RouterLink,
    SlicePipe,
    RecyclerRequestsStatsPanelComponent
  ],
  template: `
    <section class="page-shell">
      <app-recycler-requests-stats-panel *ngIf="isAdminUser" />

      <section *ngIf="isAdminUser" class="admin-donor-lots-panel">
        <h2 class="admin-donor-title">Lots donateurs — gestion (CRUD)</h2>
        <p class="admin-donor-hint">
          Contrôlez la visibilité recycleur (listé / pausé), la quantité (kg) et supprimez une entrée locale. Les lots
          <strong>listés</strong> avec kg &gt; 0 sont proposés dans le formulaire « Create Request » ci-dessous.
        </p>
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

      <div class="workspace-with-aside">
        <div class="workspace-main">
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
                <p *ngIf="isAdminUser" class="field-hint">
                  Liste : lots <strong>listés</strong> avec stock &gt; 0. Filtrez par donateur pour réduire la liste.
                </p>

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
              <p class="hint">
                Tip: approved items are validated by the back office, available items can be collected immediately.
              </p>
            </article>
          </div>

          <article class="card requests-card">
            <div class="requests-header">
              <h3>My Requests</h3>
              <button type="button" class="secondary" (click)="showOnlyOpen = !showOnlyOpen">
                {{ showOnlyOpen ? 'Show all' : 'Show open only' }}
              </button>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product</th>
                    <th *ngIf="isAdminUser">Recycleur</th>
                    <th *ngIf="isAdminUser">Donateur</th>
                    <th>Quantity (kg)</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Note</th>
                    <th>Lot info</th>
                    <th>Verification</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let request of visibleRequests">
                    <td>#{{ request.id }}</td>
                    <td>{{ request.productName }}</td>
                    <td *ngIf="isAdminUser">{{ displayNameForNutriflowKey(request.recyclerUserKey) }}</td>
                    <td *ngIf="isAdminUser">{{ displayNameForNutriflowKey(request.donorUserKey) }}</td>
                    <td>{{ request.quantityKg }}</td>
                    <td>
                      <span class="badge" [ngClass]="'badge-' + request.status">{{ request.status }}</span>
                    </td>
                    <td>{{ request.requestedAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                    <td>{{ request.note || '-' }}</td>
                    <td>
                      <span *ngIf="request.lotCode; else noLot">
                        {{ request.lotCode }}<br />
                        <small>{{ request.treatmentPlan || 'No treatment plan' }}</small>
                      </span>
                      <ng-template #noLot>-</ng-template>
                    </td>
                    <td class="verify-cell">
                      <ng-container *ngIf="request.status === 'pending_verification'">
                        <small>Submitted {{ request.verificationSubmittedAt | date: 'short' }}</small>
                      </ng-container>
                      <ng-container *ngIf="request.status === 'verified'">
                        <small class="text-success">+1 credit</small>
                      </ng-container>
                      <ng-container *ngIf="request.status === 'verification_rejected'">
                        <small class="text-danger">{{ request.adminVerificationComment || 'Rejected' }}</small>
                      </ng-container>
                      <span *ngIf="!isVerificationRow(request.status)">—</span>
                    </td>
                    <td class="actions">
                      <button
                        type="button"
                        class="secondary"
                        *ngIf="canDeclareDoneForAdminReview(request)"
                        (click)="submitOperationForVerification(request.id)"
                      >
                        Declare done (admin review)
                      </button>
                      <button
                        type="button"
                        class="danger"
                        *ngIf="request.status === 'pending' || request.status === 'awaiting_donor'"
                        (click)="cancelRequest(request.id)"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="visibleRequests.length === 0">
                    <td [attr.colspan]="isAdminUser ? 11 : 9" class="empty">No requests to display.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article class="card" *ngIf="isRecyclerCreditsUser">
            <h3>Credit history</h3>
            <p class="hint">Credits after an administrator validates a completed recycling operation.</p>
            <div class="table-wrap" *ngIf="creditsService.getLedgerForUser().length > 0; else noCredits">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Request</th>
                    <th>Amount</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of creditsService.getLedgerForUser()">
                    <td>{{ row.createdAt | date: 'short' }}</td>
                    <td>#{{ row.requestId }}</td>
                    <td>+{{ row.amount }}</td>
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

        <aside class="workspace-aside" aria-label="Résumé NutriFlow">
          <header class="hero hero--aside">
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
        </aside>
      </div>
    </section>
  `,
  styles: [`
    .page-shell {
      display: grid;
      gap: 1rem;
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

    .workspace-with-aside {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(220px, 18.5rem);
      gap: 1rem;
      align-items: start;
    }

    .workspace-main {
      display: grid;
      gap: 1rem;
      min-width: 0;
    }

    .workspace-aside {
      position: sticky;
      top: 0.75rem;
    }

    .admin-donor-lots-panel {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 14px;
      padding: 1rem 1.1rem;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.04);
      margin-bottom: 1rem;
    }

    .admin-donor-title {
      margin: 0 0 0.35rem;
      font-size: 1rem;
      color: #92400e;
    }

    .admin-donor-hint {
      margin: 0 0 0.75rem;
      color: #78716c;
      font-size: 0.85rem;
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

    .hero.hero--aside {
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: stretch;
    }

    .hero.hero--aside h2 {
      font-size: 1.05rem;
      line-height: 1.3;
    }

    .hero.hero--aside .subtitle {
      max-width: none;
      font-size: 0.82rem;
    }

    .hero.hero--aside .hero-metrics {
      grid-template-columns: 1fr;
    }

    .hero.hero--aside .hero-metrics article {
      min-width: 0;
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
      max-width: 40rem;
    }

    .workspace-main .layout-grid-single {
      max-width: none;
    }

    .workspace-main .card-request {
      max-width: 36rem;
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

    .badge-available {
      background: #ecfdf5;
      color: #065f46;
      border-color: #a7f3d0;
    }

    .badge-approved {
      background: #eff6ff;
      color: #1d4ed8;
      border-color: #bfdbfe;
    }

    .badge-done {
      background: #f3f4f6;
      color: #374151;
      border-color: #d1d5db;
    }

    .badge-pending {
      background: #fffbeb;
      color: #92400e;
      border-color: #fde68a;
    }

    .badge-rejected {
      background: #fef2f2;
      color: #991b1b;
      border-color: #fecaca;
    }

    .badge-awaiting_donor {
      background: #fdf4ff;
      color: #86198f;
      border-color: #e879f9;
    }

    .badge-pending_verification {
      background: #eef2ff;
      color: #3730a3;
      border-color: #c7d2fe;
    }

    .badge-verified {
      background: #ecfdf5;
      color: #047857;
      border-color: #6ee7b7;
    }

    .badge-verification_rejected {
      background: #fff7ed;
      color: #9a3412;
      border-color: #fed7aa;
    }

    .verify-cell small {
      display: block;
      line-height: 1.3;
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

    .hint {
      margin: 0.8rem 0 0;
      color: #6b7280;
      font-size: 0.8rem;
    }

    .field-hint {
      margin: -0.35rem 0 0;
      color: #6b7280;
      font-size: 0.78rem;
      line-height: 1.35;
    }

    .requests-card {
      margin-bottom: 0.2rem;
    }

    .requests-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.7rem;
      margin-bottom: 0.75rem;
    }

    .actions {
      display: flex;
      gap: 0.45rem;
    }

    @media (max-width: 1024px) {
      .layout-grid {
        grid-template-columns: 1fr;
      }

      .workspace-with-aside {
        grid-template-columns: 1fr;
      }

      .workspace-aside {
        position: static;
        order: 1;
      }

      .workspace-main {
        order: 0;
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

  protected showOnlyOpen = false;
  protected requestSubmitError = '';
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
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onHubPulled);
      window.removeEventListener(DONOR_LOTS_MUTATED_EVENT, this.onDonorLotsMutated);
    }
  }

  private refreshFromStorage(): void {
    this.requests = loadRecyclerRequests();
    this.products = this.getProductsFromAdmin();
    this.allDonorLotsAdmin = [...loadAllDonorLots()].sort((a, b) => b.id - a.id);
    this.nextRequestId =
      this.requests.length > 0 ? Math.max(...this.requests.map((entry) => entry.id)) + 1 : 1001;
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

  protected get visibleRequests(): RecyclerRequest[] {
    const key = this.creditsService.getCurrentRecyclerKey();
    const scope = this.isAdminUser
      ? this.requests
      : this.requests.filter((r) => !r.recyclerUserKey || r.recyclerUserKey === key);
    const data = this.showOnlyOpen
      ? scope.filter((r) =>
          ['awaiting_donor', 'pending', 'approved', 'available', 'pending_verification'].includes(r.status)
        )
      : scope;
    return [...data].sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
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

  /**
   * Catalogue admin : seulement <code>available</code>.
   * Lots donateur : avant correctif, acceptation donateur → <code>pending</code> (avec <code>donorLotId</code>) — on permet encore « Declare done ».
   */
  protected canDeclareDoneForAdminReview(request: RecyclerRequest): boolean {
    if (request.status === 'available') {
      return true;
    }
    return request.status === 'pending' && request.donorLotId != null;
  }

  protected submitOperationForVerification(requestId: number): void {
    const key = this.creditsService.getCurrentRecyclerKey();
    this.requests = this.requests.map((request) => {
      if (request.id !== requestId || !this.canDeclareDoneForAdminReview(request)) {
        return request;
      }
      return {
        ...request,
        status: 'pending_verification',
        recyclerUserKey: request.recyclerUserKey ?? key,
        verificationSubmittedAt: new Date().toISOString()
      };
    });
    this.persistRequests();
  }

  protected cancelRequest(requestId: number): void {
    const request = this.requests.find((entry) => entry.id === requestId);
    if (!request) {
      return;
    }

    this.requests = this.requests.filter((entry) => entry.id !== requestId);
    this.persistRequests();
    if (request.status === 'awaiting_donor') {
      return;
    }
    const product = this.products.find((p) => p.id === request.productId);
    if (product) {
      product.availableKg += request.quantityKg;
      if (product.status === 'done') {
        product.status = 'available';
      }
      this.persistProducts();
    }
  }

  protected isVerificationRow(status: RequestStatus): boolean {
    return status === 'pending_verification' || status === 'verified' || status === 'verification_rejected';
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
