import { Component, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { AuthService } from '../../gestion-user/services/auth.service';
import { LotService } from '../../gestion-donneur-matching/services/lot.service';
import { LotResponse } from '../../gestion-donneur-matching/models/lot.model';
import {
  DonorLotRecord,
  loadAllDonorLots,
  loadLotsForDonorKeys,
  nextDonorLotId,
  saveAllDonorLots
} from '../storage/donor-lots.storage';
import {
  loadRecyclerRequests,
  RECYCLER_REQUESTS_CHANGED_EVENT,
  RECYCLER_REQUESTS_STORAGE_KEY,
  RecyclerRequest,
  saveRecyclerRequests
} from '../storage/recycler-operations.storage';
import { NUTRIFLOW_HUB_PULLED_EVENT } from '../services/nutriflow-hub-sync.service';

@Component({
  selector: 'app-donor-valorisation-workspace',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, DatePipe, RouterLink],
  template: `
    <section class="mb-4">
      <div class="p-4 rounded text-white hero">
        <h2 class="h4 mb-1">Espace donateur NutriFlow</h2>
        <p class="mb-0 small opacity-90">
          Choisissez un <strong>lot matching</strong> (module donneur), publiez-le pour les recycleurs, puis
          <strong>acceptez ou refusez</strong> leurs demandes.
        </p>
      </div>
    </section>

    <div class="row g-4">
      <div class="col-lg-5">
        <div class="card shadow-sm h-100 publish-lot-card">
          <div class="card-header bg-white fw-semibold">
            <i class="bi bi-plus-circle me-2 text-success"></i>Publier un lot pour le recyclage
          </div>
          <div class="card-body publish-card-body">
            <div *ngIf="formError" class="alert alert-warning small py-2 mb-3">{{ formError }}</div>
            <div *ngIf="formSuccess" class="alert alert-success small py-2 mb-3">{{ formSuccess }}</div>
            <div *ngIf="matchingError" class="alert alert-danger small py-2 mb-3">{{ matchingError }}</div>
            <div *ngIf="matchingLotsInfo" class="alert alert-info small py-2 mb-3">{{ matchingLotsInfo }}</div>
            <div *ngIf="loadingMatching" class="text-muted small mb-3">Chargement de vos lots…</div>

            <form novalidate (ngSubmit)="publishLot()" class="vstack gap-3" *ngIf="!loadingMatching">
              <div>
                <label class="form-label small" id="lot-picker-label">Lot (module matching donneur)</label>
                <div class="lot-picker-wrap position-relative">
                  <button
                    type="button"
                    class="form-select form-select-sm text-start d-flex align-items-center justify-content-between w-100"
                    (click)="toggleLotPicker($event)"
                    [disabled]="matchingLots.length === 0"
                    [attr.aria-expanded]="lotPickerOpen"
                    aria-haspopup="listbox"
                    aria-labelledby="lot-picker-label"
                  >
                    <span class="text-truncate me-2">{{ selectedLotSummary }}</span>
                  </button>
                  <div
                    *ngIf="lotPickerOpen"
                    class="lot-picker-menu list-group position-absolute w-100 mt-1 shadow border rounded overflow-auto"
                    role="listbox"
                  >
                    <button
                      type="button"
                      class="list-group-item list-group-item-action list-group-item-secondary small py-2 px-3 border-0 rounded-0 text-start"
                      *ngFor="let l of matchingLots"
                      (click)="pickLot(l, $event)"
                    >
                      <strong>#{{ l.idLot }}</strong> — {{ l.nombreProduits }} produit(s) — {{ l.statut }} —
                      {{ l.niveauUrgence }}
                    </button>
                  </div>
                </div>
                <p *ngIf="!loadingMatching && matchingLots.length === 0" class="text-muted small mt-2 mb-0">
                  Aucun lot trouvé pour votre compte.
                  <a routerLink="/donneur/lots" class="link-success">Créer ou gérer vos lots</a>
                </p>
              </div>
              <div>
                <label class="form-label small">Quantité proposée au recyclage (kg)</label>
                <input
                  class="form-control form-control-sm"
                  type="number"
                  min="1"
                  step="1"
                  [(ngModel)]="publishDraft.quantityKg"
                  name="pubQty"
                />
              </div>
              <div>
                <label class="form-label small">Lieu / entrepôt</label>
                <input
                  class="form-control form-control-sm"
                  [(ngModel)]="publishDraft.location"
                  name="pubLoc"
                  placeholder="Ex. Entrepôt nord"
                />
              </div>
              <div>
                <label class="form-label small">Image (URL, optionnel)</label>
                <input class="form-control form-control-sm" [(ngModel)]="publishDraft.imageUrl" name="pubImg" />
              </div>
              <button type="submit" class="btn btn-success btn-sm" [disabled]="matchingLots.length === 0">
                Publier pour les recycleurs
              </button>
            </form>
            <p class="text-muted small mt-3 mb-0">
              Les recycleurs voient uniquement les lots <strong>publiés</strong> ici (stockage navigateur + hub
              NutriFlow si activé). La quantité diminue après votre <strong>acceptation</strong> d’une demande.
            </p>
          </div>
        </div>
      </div>

      <div class="col-lg-7">
        <div class="card shadow-sm mb-4">
          <div class="card-header bg-white fw-semibold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-inbox me-2 text-warning"></i>Demandes recycleurs (à traiter)</span>
            <span class="badge bg-warning text-dark">{{ pendingIncoming.length }}</span>
          </div>
          <div class="card-body p-0">
            <div *ngIf="pendingIncoming.length === 0" class="p-4 text-muted small">
              Aucune demande en attente de votre accord.
            </div>
            <div class="table-responsive" *ngIf="pendingIncoming.length > 0">
              <table class="table table-sm table-hover mb-0 align-middle">
                <thead class="table-light">
                  <tr>
                    <th>#</th>
                    <th>Produit</th>
                    <th>Qté</th>
                    <th>Recycleur</th>
                    <th>Date</th>
                    <th>Note</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of pendingIncoming">
                    <td>{{ r.id }}</td>
                    <td>{{ r.productName }}</td>
                    <td>{{ r.quantityKg }} kg</td>
                    <td><code class="small">{{ r.recyclerUserKey || '—' }}</code></td>
                    <td>{{ r.requestedAt | date: 'short' }}</td>
                    <td class="small">{{ r.note || '—' }}</td>
                    <td class="text-nowrap">
                      <button type="button" class="btn btn-success btn-sm me-1" (click)="acceptRequest(r)">
                        Accepter
                      </button>
                      <button type="button" class="btn btn-outline-danger btn-sm" (click)="rejectRequest(r)">
                        Refuser
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card shadow-sm">
          <div class="card-header bg-white fw-semibold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-box-seam me-2 text-success"></i>Mes offres recyclage</span>
            <button type="button" class="btn btn-outline-secondary btn-sm" (click)="refreshAll()">Rafraîchir</button>
          </div>
          <div class="card-body p-0">
            <div *ngIf="myLots.length === 0" class="p-4 text-muted small">
              Aucune offre publiée. Sélectionnez un lot matching à gauche.
            </div>
            <div class="table-responsive" *ngIf="myLots.length > 0">
              <table class="table table-sm mb-0 align-middle">
                <thead class="table-light">
                  <tr>
                    <th>Nom</th>
                    <th>Matching</th>
                    <th>Stock (kg)</th>
                    <th>Lieu</th>
                    <th>Visibilité</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let lot of myLots">
                    <td>{{ lot.name }}</td>
                    <td>
                      <span *ngIf="lot.matchingLotId != null" class="badge bg-light text-dark border"
                        >#{{ lot.matchingLotId }}</span
                      >
                      <span *ngIf="lot.matchingLotId == null" class="text-muted small">—</span>
                    </td>
                    <td>{{ lot.quantityKg }}</td>
                    <td>{{ lot.location }}</td>
                    <td>
                      <span class="badge" [ngClass]="lot.listingStatus === 'listed' ? 'bg-success' : 'bg-secondary'">
                        {{ lot.listingStatus === 'listed' ? 'Listé' : 'Pausé' }}
                      </span>
                    </td>
                    <td class="text-nowrap">
                      <button type="button" class="btn btn-outline-secondary btn-sm me-1" (click)="toggleList(lot)">
                        {{ lot.listingStatus === 'listed' ? 'Pause' : 'Lister' }}
                      </button>
                      <button
                        type="button"
                        class="btn btn-outline-danger btn-sm"
                        [disabled]="lot.quantityKg > 0"
                        (click)="removeLot(lot)"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .hero {
        background: linear-gradient(135deg, #14532d, #166534);
      }
      .publish-lot-card,
      .publish-card-body {
        overflow: visible;
      }
      .lot-picker-menu {
        z-index: 1080;
        max-height: 280px;
        background: #fff;
      }
      .lot-picker-wrap .form-select {
        cursor: pointer;
      }
    `
  ]
})
export class DonorValorisationWorkspaceComponent implements OnInit, OnDestroy {
  myLots: DonorLotRecord[] = [];
  allRequests: RecyclerRequest[] = [];
  pendingIncoming: RecyclerRequest[] = [];

  matchingLots: LotResponse[] = [];
  loadingMatching = false;
  matchingError = '';
  /** Explication si on affiche tous les lots (donneurId ≠ idUser profil). */
  matchingLotsInfo = '';
  selectedMatchingLotId: number | null = null;
  /** Native select inside grid/card can fail to open in some browsers — custom menu instead. */
  lotPickerOpen = false;

  publishDraft = {
    quantityKg: 1,
    location: '',
    imageUrl: ''
  };

  formError = '';
  formSuccess = '';

  private readonly onRequestsSynced = (): void => {
    this.ngZone.run(() => this.reload());
  };

  private readonly onStorage = (event: StorageEvent): void => {
    if (event.key === RECYCLER_REQUESTS_STORAGE_KEY) {
      this.ngZone.run(() => this.reload());
    }
  };

  private readonly onHubPulled = (): void => {
    this.ngZone.run(() => this.reload());
  };

  constructor(
    private auth: AuthService,
    private lotService: LotService,
    private ngZone: NgZone
  ) {}

  get selectedLotSummary(): string {
    if (this.selectedMatchingLotId == null) {
      return 'Choisir un lot…';
    }
    const l = this.matchingLots.find((x) => x.idLot === this.selectedMatchingLotId);
    if (!l) {
      return 'Choisir un lot…';
    }
    return `#${l.idLot} — ${l.nombreProduits} prod. — ${l.statut}`;
  }

  toggleLotPicker(event: MouseEvent): void {
    event.stopPropagation();
    if (this.matchingLots.length === 0) {
      return;
    }
    this.lotPickerOpen = !this.lotPickerOpen;
  }

  pickLot(l: LotResponse, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedMatchingLotId = l.idLot;
    this.lotPickerOpen = false;
    this.onMatchingLotChange();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    const t = ev.target as HTMLElement;
    if (!t.closest('.lot-picker-wrap')) {
      this.lotPickerOpen = false;
    }
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, this.onRequestsSynced);
      window.addEventListener('storage', this.onStorage);
      window.addEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onHubPulled);
    }

    if (!this.auth.getCurrentUser()) {
      this.auth.fetchUserProfile().subscribe({
        next: () => this.refreshAll(),
        error: () => {
          this.formError = 'Impossible de charger le profil. Reconnectez-vous.';
        }
      });
      return;
    }
    this.refreshAll();
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, this.onRequestsSynced);
      window.removeEventListener('storage', this.onStorage);
      window.removeEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onHubPulled);
    }
  }

  refreshAll(): void {
    this.reload();
    this.loadMatchingLots();
  }

  loadMatchingLots(): void {
    const u = this.auth.getCurrentUser();
    if (!u?.idUser) {
      this.matchingLots = [];
      this.matchingLotsInfo = '';
      return;
    }
    this.loadingMatching = true;
    this.matchingError = '';
    this.matchingLotsInfo = '';
    const idUser = Number(u.idUser);

    forkJoin({
      all: this.lotService.getAll().pipe(catchError(() => of([] as LotResponse[]))),
      byDonor: this.lotService.getByDonneurId(idUser).pipe(catchError(() => of([] as LotResponse[])))
    }).subscribe({
      next: ({ all, byDonor }) => {
        const sortLots = (rows: LotResponse[]) => [...rows].sort((a, b) => b.idLot - a.idLot);
        let rows: LotResponse[] = [];

        if (byDonor.length > 0) {
          rows = byDonor;
        } else {
          const mine = (all ?? []).filter((l) => Number(l.donneurId) === idUser);
          if (mine.length > 0) {
            rows = mine;
          } else if ((all ?? []).length > 0) {
            rows = all ?? [];
            this.matchingLotsInfo =
              `Vos lots en base n’utilisent pas donneurId = ${idUser} (id profil NutriFlow). ` +
              `Tous les lots sont listés pour publication — pour un filtre automatique, créez vos lots avec « ID du Donneur » = ${idUser} dans le module donneur.`;
          }
        }

        this.matchingLots = sortLots(rows);
        this.loadingMatching = false;
      },
      error: () => {
        this.matchingError =
          'Impossible de charger les lots. Vérifiez ms gestion donneur (8082), CORS et que vous êtes connecté.';
        this.matchingLots = [];
        this.loadingMatching = false;
      }
    });
  }

  onMatchingLotChange(): void {
    const lot = this.matchingLots.find((l) => l.idLot === this.selectedMatchingLotId);
    if (!lot) {
      return;
    }
    this.publishDraft.quantityKg = Math.max(1, lot.nombreProduits);
    if (!this.publishDraft.location.trim()) {
      this.publishDraft.location = 'Entrepôt donateur';
    }
  }

  reload(): void {
    const aliases = this.auth.getNutriflowUserKeyAliases();
    this.myLots = loadLotsForDonorKeys(aliases);
    this.allRequests = loadRecyclerRequests();
    const donorKeys = new Set(aliases);
    const myLotIds = new Set(this.myLots.map((l) => l.id));
    this.pendingIncoming = this.allRequests
      .filter((r) => {
        if (r.status !== 'awaiting_donor') {
          return false;
        }
        if (r.donorUserKey != null && donorKeys.has(r.donorUserKey)) {
          return true;
        }
        return r.donorLotId != null && myLotIds.has(r.donorLotId);
      })
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  publishLot(): void {
    this.formError = '';
    this.formSuccess = '';

    const key = this.auth.getNutriflowOwnerKeyForNewRecords();
    if (key === 'local:anonymous') {
      this.formError =
        'Profil non chargé : reconnectez-vous ou ouvrez cette page depuis le dashboard une fois le profil chargé.';
      return;
    }

    if (this.selectedMatchingLotId == null) {
      this.formError = 'Sélectionnez un lot matching.';
      return;
    }

    const lot = this.matchingLots.find((l) => l.idLot === this.selectedMatchingLotId);
    if (!lot) {
      this.formError = 'Lot introuvable. Rechargez la liste.';
      return;
    }

    const location = (this.publishDraft.location ?? '').trim();
    if (!location) {
      this.formError = 'Indiquez un lieu / entrepôt.';
      return;
    }

    const qty = Math.floor(Number(this.publishDraft.quantityKg));
    if (!Number.isFinite(qty) || qty < 1) {
      this.formError = 'Indiquez une quantité d’au moins 1 kg.';
      return;
    }

    try {
      const lots = loadAllDonorLots();
      const existingIdx = lots.findIndex((l) => l.donorUserKey === key && l.matchingLotId === lot.idLot);
      const name = `Lot matching #${lot.idLot} (${lot.nombreProduits} produit(s))`;
      const category = String(lot.niveauUrgence ?? 'LOT_DONATEUR');

      const record: DonorLotRecord = {
        id: existingIdx >= 0 ? lots[existingIdx].id : nextDonorLotId(),
        donorUserKey: key,
        matchingLotId: lot.idLot,
        name,
        category,
        quantityKg: qty,
        location,
        imageUrl: (this.publishDraft.imageUrl ?? '').trim() || undefined,
        listingStatus: 'listed'
      };

      if (existingIdx >= 0) {
        lots[existingIdx] = { ...lots[existingIdx], ...record, id: lots[existingIdx].id };
      } else {
        lots.push(record);
      }
      saveAllDonorLots(lots);
      this.reload();
      this.formSuccess = 'Lot publié : visible par les recycleurs.';
      window.setTimeout(() => (this.formSuccess = ''), 4000);
    } catch (e) {
      this.formError =
        'Impossible d’enregistrer (quota navigateur, mode privé, ou données corrompues). Essayez un autre navigateur ou videz un peu le stockage.';
      console.error('saveAllDonorLots', e);
    }
  }

  toggleList(lot: DonorLotRecord): void {
    const aliases = new Set(this.auth.getNutriflowUserKeyAliases());
    if (!aliases.has(lot.donorUserKey)) {
      return;
    }
    const lots = loadAllDonorLots();
    const idx = lots.findIndex((l) => l.id === lot.id);
    if (idx < 0) {
      return;
    }
    lots[idx] = {
      ...lots[idx],
      listingStatus: lots[idx].listingStatus === 'listed' ? 'paused' : 'listed'
    };
    saveAllDonorLots(lots);
    this.reload();
  }

  removeLot(lot: DonorLotRecord): void {
    const aliases = new Set(this.auth.getNutriflowUserKeyAliases());
    if (!aliases.has(lot.donorUserKey) || lot.quantityKg > 0) {
      return;
    }
    const lots = loadAllDonorLots().filter((l) => l.id !== lot.id);
    saveAllDonorLots(lots);
    this.reload();
  }

  acceptRequest(r: RecyclerRequest): void {
    const aliases = new Set(this.auth.getNutriflowUserKeyAliases());
    if (
      r.donorUserKey == null ||
      !aliases.has(r.donorUserKey) ||
      r.status !== 'awaiting_donor' ||
      r.donorLotId == null
    ) {
      return;
    }
    const lots = loadAllDonorLots();
    const idx = lots.findIndex((l) => l.id === r.donorLotId && aliases.has(l.donorUserKey));
    if (idx < 0 || lots[idx].quantityKg < r.quantityKg) {
      return;
    }
    lots[idx] = { ...lots[idx], quantityKg: lots[idx].quantityKg - r.quantityKg };
    saveAllDonorLots(lots);

    const nextStatus = 'available' as const;

    const updated = loadRecyclerRequests().map((req) =>
      req.id === r.id
        ? {
            ...req,
            status: nextStatus
          }
        : req
    );
    saveRecyclerRequests(updated);
    this.reload();
  }

  rejectRequest(r: RecyclerRequest): void {
    const aliases = new Set(this.auth.getNutriflowUserKeyAliases());
    if (r.donorUserKey == null || !aliases.has(r.donorUserKey) || r.status !== 'awaiting_donor') {
      return;
    }
    const updated = loadRecyclerRequests().map((req) =>
      req.id === r.id
        ? {
            ...req,
            status: 'rejected' as const,
            managerComment: 'Refusé par le donateur'
          }
        : req
    );
    saveRecyclerRequests(updated);
    this.reload();
  }
}
