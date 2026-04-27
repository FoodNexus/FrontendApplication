import { Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import {
  loadRecyclerRequests,
  RECYCLER_REQUESTS_CHANGED_EVENT,
  RecyclerRequest,
  RequestStatus
} from '../storage/recycler-operations.storage';
import {
  DONOR_LOTS_MUTATED_EVENT,
  loadAllDonorLots,
  loadListedDonorLotsForRecycler
} from '../storage/donor-lots.storage';
import { NUTRIFLOW_HUB_PULLED_EVENT } from '../services/nutriflow-hub-sync.service';

type Slice = { status: RequestStatus; label: string; color: string; count: number };

const STATUS_META: Record<
  RequestStatus,
  { label: string; color: string }
> = {
  awaiting_donor: { label: 'Attente donateur', color: '#d97706' },
  pending: { label: 'En attente', color: '#ca8a04' },
  approved: { label: 'Approuvé', color: '#2563eb' },
  available: { label: 'Disponible', color: '#059669' },
  done: { label: 'Terminé', color: '#4b5563' },
  rejected: { label: 'Refusé', color: '#dc2626' },
  pending_verification: { label: 'Vérif. admin', color: '#7c3aed' },
  verified: { label: 'Vérifié', color: '#0d9488' },
  verification_rejected: { label: 'Vérif. refusée', color: '#be123c' }
};

@Component({
  selector: 'app-recycler-requests-stats-panel',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe],
  template: `
    <section class="stats-panel" aria-label="Statistiques demandes NutriFlow">
      <div class="stats-head">
        <h2 class="stats-title">{{ panelTitle }}</h2>
        <p class="stats-sub small mb-0">{{ panelSubtitle }}</p>
      </div>

      <div class="stats-grid">
        <article class="stat-tile">
          <span>Demandes</span>
          <strong>{{ totalRequests }}</strong>
        </article>
        <article class="stat-tile">
          <span>Volume demandé</span>
          <strong>{{ totalKg | number: '1.0-0' }} kg</strong>
        </article>
        <article class="stat-tile">
          <span>Lots donateur listés</span>
          <strong>{{ listedLotsCount }}</strong>
        </article>
        <article class="stat-tile">
          <span>Lots donateur (total)</span>
          <strong>{{ allLotsCount }}</strong>
        </article>
      </div>

      <div class="pie-row">
        <div
          class="pie-donut"
          [style.background]="pieGradient"
          role="img"
          [attr.aria-label]="pieAriaLabel"
        >
          <div class="pie-hole">
            <span class="pie-total">{{ totalRequests }}</span>
            <span class="pie-total-label">demandes</span>
          </div>
        </div>

        <ul class="legend" *ngIf="slices.length > 0">
          <li *ngFor="let s of slices">
            <span class="swatch" [style.background]="s.color"></span>
            <span class="legend-label">{{ s.label }}</span>
            <span class="legend-count">{{ s.count }}</span>
            <span class="legend-pct text-muted" *ngIf="totalRequests > 0">
              ({{ (s.count / totalRequests) * 100 | number: '1.0-0' }}&nbsp;%)
            </span>
          </li>
        </ul>

        <p *ngIf="slices.length === 0" class="empty-pie small mb-0">
          Aucune demande enregistrée — la répartition apparaîtra dès les premières demandes.
        </p>
      </div>
    </section>
  `,
  styles: [`
    .stats-panel {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 1rem 1.15rem;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.04);
    }
    .stats-head {
      margin-bottom: 0.85rem;
    }
    .stats-title {
      margin: 0 0 0.25rem;
      font-size: 1.05rem;
      color: #111827;
    }
    .stats-sub {
      color: #6b7280;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 0.65rem;
      margin-bottom: 1rem;
    }
    .stat-tile {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 0.55rem 0.65rem;
    }
    .stat-tile span {
      display: block;
      font-size: 0.72rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 0.2rem;
    }
    .stat-tile strong {
      font-size: 1.05rem;
      color: #111827;
    }
    .pie-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1.25rem;
    }
    .pie-donut {
      width: 168px;
      height: 168px;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
    }
    .pie-hole {
      width: 52%;
      height: 52%;
      border-radius: 50%;
      background: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);
    }
    .pie-total {
      font-size: 1.35rem;
      font-weight: 700;
      color: #111827;
      line-height: 1.1;
    }
    .pie-total-label {
      font-size: 0.68rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .legend {
      list-style: none;
      margin: 0;
      padding: 0;
      flex: 1;
      min-width: 200px;
    }
    .legend li {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      flex-wrap: wrap;
      font-size: 0.84rem;
      padding: 0.28rem 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .legend li:last-child {
      border-bottom: none;
    }
    .swatch {
      width: 11px;
      height: 11px;
      border-radius: 2px;
      flex-shrink: 0;
    }
    .legend-label {
      flex: 1;
      color: #374151;
    }
    .legend-count {
      font-weight: 600;
      color: #111827;
    }
    .legend-pct {
      font-size: 0.78rem;
      color: #6b7280;
    }
    .empty-pie {
      flex: 1;
      min-width: 200px;
      color: #6b7280;
    }
  `]
})
export class RecyclerRequestsStatsPanelComponent implements OnInit, OnDestroy {
  @Input() panelTitle = 'Statistiques & répartition';
  @Input() panelSubtitle = 'Données locales (navigateur) — toutes les demandes recycleurs.';

  protected totalRequests = 0;
  protected totalKg = 0;
  protected listedLotsCount = 0;
  protected allLotsCount = 0;
  protected slices: Slice[] = [];
  protected pieGradient = '#e5e7eb';
  protected pieAriaLabel = 'Aucune donnée';

  private readonly onRefresh = (): void => {
    this.ngZone.run(() => this.refresh());
  };

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    this.refresh();
    if (typeof window !== 'undefined') {
      window.addEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, this.onRefresh);
      window.addEventListener(DONOR_LOTS_MUTATED_EVENT, this.onRefresh);
      window.addEventListener('nutriflow-admin-recyclables-changed', this.onRefresh);
      window.addEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onRefresh);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, this.onRefresh);
      window.removeEventListener(DONOR_LOTS_MUTATED_EVENT, this.onRefresh);
      window.removeEventListener('nutriflow-admin-recyclables-changed', this.onRefresh);
      window.removeEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onRefresh);
    }
  }

  private refresh(): void {
    const requests = loadRecyclerRequests();
    this.totalRequests = requests.length;
    this.totalKg = requests.reduce((s, r) => s + (Number(r.quantityKg) || 0), 0);
    this.listedLotsCount = loadListedDonorLotsForRecycler().length;
    this.allLotsCount = loadAllDonorLots().length;

    const counts = new Map<RequestStatus, number>();
    for (const r of requests) {
      counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
    }

    this.slices = (Object.keys(STATUS_META) as RequestStatus[])
      .map((status) => ({
        status,
        label: STATUS_META[status].label,
        color: STATUS_META[status].color,
        count: counts.get(status) ?? 0
      }))
      .filter((s) => s.count > 0);

    this.pieGradient = this.buildPieGradient(this.slices);
    this.pieAriaLabel = this.buildAriaLabel(requests, this.slices);
  }

  private buildPieGradient(slices: Slice[]): string {
    const total = slices.reduce((a, s) => a + s.count, 0);
    if (total === 0) {
      return 'conic-gradient(#e5e7eb 0deg 360deg)';
    }
    let angle = 0;
    const parts: string[] = [];
    for (const s of slices) {
      const deg = (s.count / total) * 360;
      const end = angle + deg;
      parts.push(`${s.color} ${angle}deg ${end}deg`);
      angle = end;
    }
    return `conic-gradient(${parts.join(', ')})`;
  }

  private buildAriaLabel(requests: RecyclerRequest[], slices: Slice[]): string {
    if (requests.length === 0) {
      return 'Répartition des demandes : aucune donnée';
    }
    const parts = slices.map((s) => `${s.label} ${s.count}`);
    return `Répartition des ${requests.length} demandes : ${parts.join(', ')}`;
  }
}
