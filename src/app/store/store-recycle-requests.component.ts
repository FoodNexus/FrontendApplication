import { Component } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

type RequestStatus = 'pending' | 'approved' | 'available' | 'done' | 'rejected';
type AdminStatus = 'In Process' | 'Recycled' | 'Pending Collection' | 'Rejected';

interface StoredRequest {
  id: number;
  productId: number;
  productName: string;
  quantityKg: number;
  note: string;
  status: RequestStatus;
  requestedAt: string;
  lotCode?: string;
  treatmentPlan?: string;
  pickupWindow?: string;
  managerComment?: string;
}

interface AdminRecyclable {
  id: number;
  name: string;
  quantityKg: number;
  status: AdminStatus;
  imageUrl: string;
}

@Component({
  selector: 'app-store-recycle-requests',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, DatePipe],
  template: `
    <div class="store-shell">
      <header class="topbar">
        <div class="topbar-inner">
          <div class="brand">
            <p class="eyebrow">NORDIC Store Back Office</p>
            <h1>Recycler Request Validation</h1>
            <p class="subtitle">Accept requests, assign lot details, and move lots to recycle flow</p>
          </div>
          <button type="button" class="secondary" (click)="refreshFromStorage()">Refresh Data</button>
        </div>
      </header>

      <main class="content">
        <section class="metrics">
          <article><span>Pending</span><strong>{{ pendingCount }}</strong></article>
          <article><span>Approved</span><strong>{{ approvedCount }}</strong></article>
          <article><span>Ready / Available</span><strong>{{ availableCount }}</strong></article>
          <article><span>Completed</span><strong>{{ doneCount }}</strong></article>
        </section>

        <section class="card">
          <div class="card-header">
            <h2>Incoming Recycler Requests</h2>
            <select [(ngModel)]="statusFilter">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="available">Available</option>
              <option value="done">Done</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Image</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Lot</th>
                  <th>Requested</th>
                  <th>Recycler note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let req of filteredRequests">
                  <td>#{{ req.id }}</td>
                  <td>{{ req.productName }}</td>
                  <td>
                    <img
                      *ngIf="getProductImage(req.productId); else noImage"
                      [src]="getProductImage(req.productId)"
                      [alt]="req.productName"
                      class="thumb"
                    />
                    <ng-template #noImage><span class="muted">No image</span></ng-template>
                  </td>
                  <td>{{ req.quantityKg }} kg</td>
                  <td><span class="badge" [ngClass]="'badge-' + req.status">{{ req.status }}</span></td>
                  <td>{{ req.lotCode || '-' }}</td>
                  <td>{{ req.requestedAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td>{{ req.note || '-' }}</td>
                  <td class="actions">
                    <button type="button" class="secondary" (click)="startReview(req)">Review</button>
                    <button type="button" class="danger" *ngIf="req.status === 'pending'" (click)="reject(req.id)">
                      Reject
                    </button>
                    <button type="button" class="success" *ngIf="req.status === 'approved'" (click)="markAvailable(req.id)">
                      Set Available
                    </button>
                    <button type="button" class="secondary" *ngIf="req.status === 'available'" (click)="markDone(req.id)">
                      Mark Done
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredRequests.length === 0">
                  <td colspan="9" class="empty">No requests for this filter.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="card">
          <h2>Lot Review and Acceptance</h2>
          <form class="review-form" (ngSubmit)="acceptWithLot()">
            <label>
              Request
              <select [(ngModel)]="review.requestId" name="requestId" required>
                <option [ngValue]="null" disabled>Select a request</option>
                <option *ngFor="let req of pendingOrApprovedRequests" [ngValue]="req.id">
                  #{{ req.id }} - {{ req.productName }} ({{ req.quantityKg }}kg)
                </option>
              </select>
            </label>

            <label>
              Lot code
              <input [(ngModel)]="review.lotCode" name="lotCode" required placeholder="LOT-2026-0415-A1" />
            </label>

            <label>
              Treatment plan
              <textarea
                [(ngModel)]="review.treatmentPlan"
                name="treatmentPlan"
                rows="2"
                placeholder="Compaction then transfer to plant"
              ></textarea>
            </label>

            <label>
              Pickup window
              <input [(ngModel)]="review.pickupWindow" name="pickupWindow" placeholder="16/04/2026 morning" />
            </label>

            <label>
              Manager comment
              <textarea
                [(ngModel)]="review.managerComment"
                name="managerComment"
                rows="2"
                placeholder="Any instructions for recycler"
              ></textarea>
            </label>

            <button type="submit">Accept and mark To Be Recycled</button>
          </form>
        </section>
      </main>

      <footer class="contact-footer">
        <div class="footer-grid">
          <section>
            <h3>About Our Team</h3>
            <p>
              We collaborate across modules to build a reliable circular-economy platform
              for receiver workflows and recycling operations.
            </p>
          </section>

          <section>
            <h3>Contact</h3>
            <p>Email: greenloop.team&#64;project.local</p>
            <p>Phone: +216 00 000 000</p>
            <p>Location: Tunis, Tunisia</p>
          </section>

          <section>
            <h3>Social</h3>
            <div class="social-links">
              <a href="#" aria-label="Twitter">Twitter</a>
              <a href="#" aria-label="Facebook">Facebook</a>
              <a href="#" aria-label="Instagram">Instagram</a>
              <a href="#" aria-label="LinkedIn">LinkedIn</a>
            </div>
          </section>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .store-shell { min-height: 100vh; background: #f5f5f0; }
    .topbar { border-bottom: 1px solid #d8d8d8; background: #fff; padding: 1.1rem 1.5rem 1rem; position: sticky; top: 0; z-index: 5; }
    .topbar-inner { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; flex-wrap: wrap; }
    .eyebrow { margin: 0; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.72rem; }
    .brand h1 { margin: 0.25rem 0 0; font-size: 1.3rem; color: #111827; text-transform: uppercase; }
    .subtitle { margin: 0.35rem 0 0; color: #6b7280; font-size: 0.9rem; }
    .content { padding: 1.5rem; display: grid; gap: 1rem; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.8rem; }
    .metrics article { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 0.65rem 0.8rem; }
    .metrics span { display: block; color: #6b7280; font-size: 0.78rem; }
    .metrics strong { color: #111827; font-size: 1.1rem; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 1rem; box-shadow: 0 6px 24px rgba(0,0,0,0.04); }
    .card-header { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; margin-bottom: 0.7rem; flex-wrap: wrap; }
    h2 { margin: 0; font-size: 1rem; color: #111827; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 0.58rem; border-bottom: 1px solid #e5e7eb; font-size: 0.86rem; vertical-align: top; }
    .empty { text-align: center; color: #6b7280; padding: 0.9rem; }
    .actions { display: flex; gap: 0.45rem; flex-wrap: wrap; }
    .thumb { width: 56px; height: 42px; object-fit: cover; border-radius: 6px; border: 1px solid #d1d5db; display: block; }
    .muted { color: #6b7280; font-size: 0.8rem; }
    .badge { display: inline-flex; border-radius: 999px; padding: 0.16rem 0.5rem; font-size: 0.75rem; text-transform: capitalize; border: 1px solid transparent; }
    .badge-pending { background: #fffbeb; color: #92400e; border-color: #fde68a; }
    .badge-approved { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
    .badge-available { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }
    .badge-done { background: #f3f4f6; color: #374151; border-color: #d1d5db; }
    .badge-rejected { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
    input, select, textarea, button { border: 1px solid #d1d5db; border-radius: 8px; padding: 0.5rem 0.6rem; font-size: 0.9rem; font-family: inherit; }
    button { cursor: pointer; background: #065f46; border-color: #065f46; color: #fff; }
    button.secondary { background: #f3f4f6; border-color: #d1d5db; color: #111827; }
    button.success { background: #047857; border-color: #047857; color: #fff; }
    button.danger { background: #dc2626; border-color: #dc2626; color: #fff; }
    .review-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0.75rem; }
    .review-form label { display: grid; gap: 0.35rem; color: #374151; font-size: 0.83rem; }
    .contact-footer { border-top: 1px solid #d8d8d8; background: #ffffff; margin-top: 0.6rem; padding: 1.4rem 1.5rem 1.8rem; }
    .footer-grid { width: 100%; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
    .footer-grid h3 { margin: 0 0 0.5rem; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.04em; color: #111827; }
    .footer-grid p { margin: 0.25rem 0; color: #4b5563; font-size: 0.9rem; line-height: 1.4; }
    .social-links { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .social-links a { text-decoration: none; font-size: 0.85rem; color: #111827; border: 1px solid #d4d4d4; border-radius: 999px; padding: 0.3rem 0.65rem; background: #fafafa; }
    .social-links a:hover { background: #f0f0f0; }
  `]
})
export class StoreRecycleRequestsComponent {
  private readonly requestsKey = 'gestion-receveur-requests';
  private readonly recyclablesKey = 'gestion-receveur-recyclables';

  protected requests: StoredRequest[] = this.loadRequests();
  protected statusFilter: RequestStatus | 'all' = 'all';
  protected review: {
    requestId: number | null;
    lotCode: string;
    treatmentPlan: string;
    pickupWindow: string;
    managerComment: string;
  } = {
    requestId: null,
    lotCode: '',
    treatmentPlan: '',
    pickupWindow: '',
    managerComment: ''
  };

  protected get filteredRequests(): StoredRequest[] {
    const base = this.statusFilter === 'all'
      ? this.requests
      : this.requests.filter((entry) => entry.status === this.statusFilter);
    return [...base].sort((a, b) => +new Date(b.requestedAt) - +new Date(a.requestedAt));
  }

  protected get pendingOrApprovedRequests(): StoredRequest[] {
    return this.requests.filter((entry) => entry.status === 'pending' || entry.status === 'approved');
  }

  protected get pendingCount(): number { return this.requests.filter((r) => r.status === 'pending').length; }
  protected get approvedCount(): number { return this.requests.filter((r) => r.status === 'approved').length; }
  protected get availableCount(): number { return this.requests.filter((r) => r.status === 'available').length; }
  protected get doneCount(): number { return this.requests.filter((r) => r.status === 'done').length; }

  protected refreshFromStorage(): void {
    this.requests = this.loadRequests();
  }

  protected startReview(request: StoredRequest): void {
    this.review = {
      requestId: request.id,
      lotCode: request.lotCode ?? '',
      treatmentPlan: request.treatmentPlan ?? '',
      pickupWindow: request.pickupWindow ?? '',
      managerComment: request.managerComment ?? ''
    };
  }

  protected acceptWithLot(): void {
    if (this.review.requestId === null || !this.review.lotCode.trim()) {
      return;
    }

    this.requests = this.requests.map((entry) => {
      if (entry.id !== this.review.requestId) {
        return entry;
      }
      return {
        ...entry,
        status: 'approved',
        lotCode: this.review.lotCode.trim(),
        treatmentPlan: this.review.treatmentPlan.trim(),
        pickupWindow: this.review.pickupWindow.trim(),
        managerComment: this.review.managerComment.trim()
      };
    });

    this.persistRequests();
    this.updateRecyclableStatus(this.review.requestId, 'In Process');
  }

  protected reject(requestId: number): void {
    this.requests = this.requests.map((entry) => entry.id === requestId ? { ...entry, status: 'rejected' } : entry);
    this.persistRequests();
    this.updateRecyclableStatus(requestId, 'Rejected');
  }

  protected markAvailable(requestId: number): void {
    this.requests = this.requests.map((entry) => entry.id === requestId ? { ...entry, status: 'available' } : entry);
    this.persistRequests();
    this.updateRecyclableStatus(requestId, 'Pending Collection');
  }

  protected markDone(requestId: number): void {
    this.requests = this.requests.map((entry) => entry.id === requestId ? { ...entry, status: 'done' } : entry);
    this.persistRequests();
    this.updateRecyclableStatus(requestId, 'Recycled');
  }

  protected getProductImage(productId: number): string {
    const raw = localStorage.getItem(this.recyclablesKey);
    if (!raw) {
      return '';
    }
    try {
      const recyclables = JSON.parse(raw) as AdminRecyclable[];
      return recyclables.find((item) => item.id === productId)?.imageUrl ?? '';
    } catch {
      return '';
    }
  }

  private loadRequests(): StoredRequest[] {
    const raw = localStorage.getItem(this.requestsKey);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as StoredRequest[];
    } catch {
      localStorage.removeItem(this.requestsKey);
      return [];
    }
  }

  private persistRequests(): void {
    localStorage.setItem(this.requestsKey, JSON.stringify(this.requests));
  }

  private updateRecyclableStatus(requestId: number, status: AdminStatus): void {
    const request = this.requests.find((entry) => entry.id === requestId);
    if (!request) {
      return;
    }

    const raw = localStorage.getItem(this.recyclablesKey);
    if (!raw) {
      return;
    }

    try {
      const recyclables = JSON.parse(raw) as AdminRecyclable[];
      const updated = recyclables.map((item) =>
        item.id === request.productId ? { ...item, status } : item
      );
      localStorage.setItem(this.recyclablesKey, JSON.stringify(updated));
    } catch {
      // Ignore malformed data to avoid blocking UI interactions.
    }
  }
}
