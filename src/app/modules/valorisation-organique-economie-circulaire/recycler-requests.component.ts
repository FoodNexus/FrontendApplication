import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  loadRecyclerRequests,
  RecyclableProduct,
  RecyclerRequest,
  ProductStatus,
  RequestStatus,
  saveRecyclerRequests
} from './recycler-operations.storage';
import {
  DONOR_LOT_PRODUCT_ID_BASE,
  loadAllDonorLots,
  loadListedDonorLotsForRecycler,
  saveAllDonorLots
} from './donor-lots.storage';
import { RecyclerCreditsService } from './services/recycler-credits.service';
import { NUTRIFLOW_HUB_PULLED_EVENT } from './services/nutriflow-hub-sync.service';

@Component({
  selector: 'app-recycler-requests',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, DecimalPipe, DatePipe],
  template: `
    <section class="page-shell">
      <header class="hero">
        <div>
          <p class="eyebrow">Recycler Front Office</p>
          <h2>Request Recyclable Products</h2>
          <p class="subtitle">
            Browse products (admin catalogue + <strong>donor lots</strong>). Requests on donor lots stay
            <strong>awaiting donor</strong> until accepted. Then declare completion for admin verification and
            <strong>credits</strong>.
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
          <article>
            <span>Mes crédits</span>
            <strong>{{ creditsService.getBalance() }}</strong>
          </article>
        </div>
      </header>

      <div class="layout-grid">
        <article class="card">
          <h3>Available Products</h3>
          <div class="controls">
            <input
              type="text"
              [(ngModel)]="filters.search"
              placeholder="Search by product, category, or location"
            />
            <select [(ngModel)]="filters.status">
              <option value="all">All statuses</option>
              <option value="available">Available</option>
              <option value="approved">Approved</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Image</th>
                  <th>Category</th>
                  <th>Inventory (kg)</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Request</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let product of filteredProducts">
                  <td>{{ product.name }}</td>
                  <td>
                    <img
                      *ngIf="product.imageUrl"
                      [src]="product.imageUrl"
                      [alt]="product.name"
                      class="thumb"
                    />
                    <span *ngIf="!product.imageUrl" class="muted">No image</span>
                  </td>
                  <td>{{ product.category }}</td>
                  <td>{{ product.availableKg }}</td>
                  <td>{{ product.location }}</td>
                  <td>
                    <span class="badge" [ngClass]="'badge-' + product.status">{{ product.status }}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      class="secondary"
                      [disabled]="product.status === 'done' || product.availableKg === 0"
                      (click)="prepareRequest(product)"
                    >
                      Request
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredProducts.length === 0">
                  <td colspan="7" class="empty">No product matches your filters.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="card">
          <h3>Create Request</h3>
          <p *ngIf="requestSubmitError" class="alert alert-warning" style="margin:0 0 0.75rem;padding:0.5rem 0.65rem;border-radius:8px;font-size:0.85rem;">
            {{ requestSubmitError }}
          </p>
          <form class="request-form" (ngSubmit)="createRequest()">
            <label>
              Product
              <select name="productId" [(ngModel)]="draft.productId" required>
                <option [ngValue]="null" disabled>Select a product</option>
                <option *ngFor="let p of requestableProducts" [ngValue]="p.id">
                  {{ p.name }} - {{ p.availableKg }}kg ({{ p.status }})
                </option>
              </select>
            </label>

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
                <td colspan="9" class="empty">No requests to display.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="card">
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
    </section>
  `,
  styles: [`
    .page-shell {
      display: grid;
      gap: 1rem;
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

    .controls {
      display: grid;
      grid-template-columns: 1fr 180px;
      gap: 0.6rem;
      margin-bottom: 0.75rem;
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
    }

    @media (max-width: 720px) {
      .controls {
        grid-template-columns: 1fr;
      }

      .hero-metrics {
        width: 100%;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      }
    }
  `]
})
export class RecyclerRequestsComponent implements OnInit, OnDestroy {
  private readonly storageKey = 'gestion-receveur-recyclables';
  protected products: RecyclableProduct[] = this.getProductsFromAdmin();
  protected requests: RecyclerRequest[] = loadRecyclerRequests();

  protected filters: { search: string; status: ProductStatus | 'all' } = {
    search: '',
    status: 'all'
  };

  protected draft: { productId: number | null; quantityKg: number; note: string } = {
    productId: null,
    quantityKg: 1,
    note: ''
  };

  protected showOnlyOpen = false;
  protected requestSubmitError = '';
  private nextRequestId = this.requests.length > 0
    ? Math.max(...this.requests.map((entry) => entry.id)) + 1
    : 1001;

  private readonly onHubPulled = (): void => {
    this.ngZone.run(() => this.refreshFromStorage());
  };

  constructor(
    protected creditsService: RecyclerCreditsService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.refreshFromStorage();
    if (typeof window !== 'undefined') {
      window.addEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onHubPulled);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onHubPulled);
    }
  }

  private refreshFromStorage(): void {
    this.requests = loadRecyclerRequests();
    this.products = this.getProductsFromAdmin();
    this.nextRequestId =
      this.requests.length > 0 ? Math.max(...this.requests.map((entry) => entry.id)) + 1 : 1001;
  }

  protected get filteredProducts(): RecyclableProduct[] {
    const q = this.filters.search.trim().toLowerCase();
    return this.products.filter((product) => {
      const statusMatch = this.filters.status === 'all' || product.status === this.filters.status;
      const text = `${product.name} ${product.category} ${product.location}`.toLowerCase();
      const textMatch = !q || text.includes(q);
      return statusMatch && textMatch;
    });
  }

  protected get requestableProducts(): RecyclableProduct[] {
    return this.products.filter((p) => p.status !== 'done' && p.availableKg > 0);
  }

  protected get visibleRequests(): RecyclerRequest[] {
    const key = this.creditsService.getCurrentRecyclerKey();
    const mine = this.requests.filter((r) => !r.recyclerUserKey || r.recyclerUserKey === key);
    const data = this.showOnlyOpen
      ? mine.filter((r) =>
          ['awaiting_donor', 'pending', 'approved', 'available', 'pending_verification'].includes(r.status)
        )
      : mine;
    return [...data].sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  protected get totalAvailableKg(): number {
    return this.products.reduce((sum, p) => sum + p.availableKg, 0);
  }

  protected get openRequestsCount(): number {
    const key = this.creditsService.getCurrentRecyclerKey();
    return this.requests.filter(
      (r) =>
        (!r.recyclerUserKey || r.recyclerUserKey === key) &&
        ['awaiting_donor', 'pending', 'approved', 'available', 'pending_verification'].includes(r.status)
    ).length;
  }

  protected get doneRequestsCount(): number {
    const key = this.creditsService.getCurrentRecyclerKey();
    return this.requests.filter(
      (r) =>
        (!r.recyclerUserKey || r.recyclerUserKey === key) &&
        (r.status === 'done' || r.status === 'verified')
    ).length;
  }

  protected prepareRequest(product: RecyclableProduct): void {
    this.requestSubmitError = '';
    this.draft.productId = product.id;
    this.draft.quantityKg = Math.max(1, Math.min(10, product.availableKg));
  }

  protected createRequest(): void {
    this.requestSubmitError = '';
    this.products = this.getProductsFromAdmin();
    this.requests = loadRecyclerRequests();
    this.nextRequestId =
      this.requests.length > 0 ? Math.max(...this.requests.map((entry) => entry.id)) + 1 : 1001;

    if (this.draft.productId === null) {
      this.requestSubmitError = 'Sélectionnez un produit dans la liste.';
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

    const isDonorLot = donorLotId != null;
    const request: RecyclerRequest = {
      id: this.nextRequestId++,
      productId: product.id,
      productName: product.name,
      quantityKg: this.draft.quantityKg,
      note: this.draft.note.trim(),
      status: isDonorLot ? 'awaiting_donor' : product.status === 'available' ? 'available' : 'pending',
      requestedAt: new Date(),
      recyclerUserKey: this.creditsService.getCurrentRecyclerKey(),
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

    this.draft = { productId: null, quantityKg: 1, note: '' };
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
    const donorListed = loadListedDonorLotsForRecycler().map<RecyclableProduct>((lot) => ({
      id: DONOR_LOT_PRODUCT_ID_BASE + lot.id,
      name: lot.name,
      category: lot.category,
      availableKg: lot.quantityKg,
      location: lot.location,
      status: 'available',
      imageUrl: lot.imageUrl ?? '',
      donorLotId: lot.id,
      donorUserKey: lot.donorUserKey
    }));

    const cached = localStorage.getItem(this.storageKey);
    if (!cached) {
      const fallback: RecyclableProduct[] = [
        {
          id: 1,
          name: 'Plastic bottles',
          category: 'Plastic',
          availableKg: 45,
          location: 'Zone A',
          status: 'approved',
          imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=300&q=80'
        }
      ];
      return [...fallback, ...donorListed];
    }

    try {
      const adminItems = JSON.parse(cached) as Array<{
        id: number;
        name: string;
        quantityKg: number;
        status: 'In Process' | 'Recycled' | 'Pending Collection' | 'Rejected';
        imageUrl?: string;
      }>;

      const admin = adminItems.map((item, index) => ({
        id: item.id,
        name: item.name,
        category: this.detectCategory(item.name),
        availableKg: item.quantityKg,
        location: `Zone ${String.fromCharCode(65 + (index % 4))}`,
        status: this.mapAdminStatus(item.status),
        imageUrl: item.imageUrl ?? ''
      }));
      return [...admin, ...donorListed];
    } catch {
      return [...donorListed];
    }
  }

  private mapAdminStatus(status: 'In Process' | 'Recycled' | 'Pending Collection' | 'Rejected'): ProductStatus {
    if (status === 'Pending Collection') {
      return 'available';
    }
    if (status === 'In Process') {
      return 'approved';
    }
    return 'done';
  }

  private detectCategory(name: string): string {
    const normalized = name.toLowerCase();
    if (normalized.includes('plastic')) {
      return 'Plastic';
    }
    if (normalized.includes('cardboard') || normalized.includes('paper')) {
      return 'Paper';
    }
    if (normalized.includes('glass')) {
      return 'Glass';
    }
    if (normalized.includes('metal') || normalized.includes('aluminum') || normalized.includes('aluminium')) {
      return 'Metal';
    }
    return 'Mixed';
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

    const current = localStorage.getItem(this.storageKey);
    if (!current) {
      return;
    }

    try {
      const adminItems = JSON.parse(current) as Array<{
        id: number;
        name: string;
        quantityKg: number;
        status: 'In Process' | 'Recycled' | 'Pending Collection' | 'Rejected';
        imageUrl?: string;
      }>;

      const updated = adminItems.map((adminItem) => {
        const product = this.products.find((p) => p.id === adminItem.id);
        return product ? { ...adminItem, quantityKg: product.availableKg } : adminItem;
      });
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
    } catch {
      // Keep app resilient if localStorage data has unexpected shape.
    }
  }

  private persistRequests(): void {
    saveRecyclerRequests(this.requests);
  }
}
