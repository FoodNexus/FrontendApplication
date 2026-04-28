import { Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import type { RecyclerRequest, RequestStatus } from '../../models/recycler-operations.model';
import { DonorLotsService } from '../../services/donor-lots.service';
import { NutriflowRecyclerRequestsService } from '../../services/nutriflow-recycler-requests.service';
import { NUTRIFLOW_HUB_PULLED_EVENT } from '../../services/nutriflow-hub-sync.service';

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
  templateUrl: './recycler-requests-stats-panel.component.html',
  styleUrls: ['./recycler-requests-stats-panel.component.scss']
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

  constructor(
    private ngZone: NgZone,
    private donorLots: DonorLotsService,
    private recyclerRequests: NutriflowRecyclerRequestsService
  ) {}

  ngOnInit(): void {
    this.refresh();
    if (typeof window !== 'undefined') {
      window.addEventListener(NutriflowRecyclerRequestsService.CHANGED_EVENT, this.onRefresh);
      window.addEventListener(DonorLotsService.MUTATED_EVENT, this.onRefresh);
      window.addEventListener('nutriflow-admin-recyclables-changed', this.onRefresh);
      window.addEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onRefresh);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener(NutriflowRecyclerRequestsService.CHANGED_EVENT, this.onRefresh);
      window.removeEventListener(DonorLotsService.MUTATED_EVENT, this.onRefresh);
      window.removeEventListener('nutriflow-admin-recyclables-changed', this.onRefresh);
      window.removeEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onRefresh);
    }
  }

  private refresh(): void {
    const requests = this.recyclerRequests.getAll();
    this.totalRequests = requests.length;
    this.totalKg = requests.reduce((s, r) => s + (Number(r.quantityKg) || 0), 0);
    this.listedLotsCount = this.donorLots.findListedForRecycler().length;
    this.allLotsCount = this.donorLots.getAll().length;

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
