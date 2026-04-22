import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../gestion-user/services/auth.service';
import {
  DonorLotRecord,
  loadAllDonorLots,
  loadLotsForDonorKeys,
  nextDonorLotId,
  saveAllDonorLots
} from './donor-lots.storage';
import {
  loadRecyclerRequests,
  RECYCLER_REQUESTS_CHANGED_EVENT,
  RECYCLER_REQUESTS_STORAGE_KEY,
  RecyclerRequest,
  saveRecyclerRequests
} from './recycler-operations.storage';
import { NUTRIFLOW_HUB_PULLED_EVENT } from './services/nutriflow-hub-sync.service';

@Component({
  selector: 'app-donor-valorisation-workspace',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, DatePipe],
  template: `
    <section class="mb-4">
      <div class="p-4 rounded text-white hero">
        <h2 class="h4 mb-1">Espace donateur NutriFlow</h2>
        <p class="mb-0 small opacity-90">
          Publiez des <strong>lots</strong> visibles par les recycleurs, consultez vos
          <strong>produits</strong>, et <strong>acceptez ou refusez</strong> leurs demandes.
        </p>
      </div>
    </section>

    <div class="row g-4">
      <div class="col-lg-5">
        <div class="card shadow-sm h-100">
          <div class="card-header bg-white fw-semibold">
            <i class="bi bi-plus-circle me-2 text-success"></i>Ajouter un lot
          </div>
          <div class="card-body">
            <div *ngIf="formError" class="alert alert-warning small py-2 mb-3">{{ formError }}</div>
            <div *ngIf="formSuccess" class="alert alert-success small py-2 mb-3">{{ formSuccess }}</div>
            <!-- novalidate : la validation HTML5 empêchait souvent ngSubmit sans message visible -->
            <form novalidate (ngSubmit)="addLot()" class="d-grid gap-3">
              <div>
                <label class="form-label small">Nom du produit / lot</label>
                <input class="form-control form-control-sm" [(ngModel)]="draft.name" name="lotName" />
              </div>
              <div>
                <label class="form-label small">Catégorie</label>
                <input
                  class="form-control form-control-sm"
                  [(ngModel)]="draft.category"
                  name="lotCat"
                  placeholder="Ex. Plastique, Verre…"
                />
              </div>
              <div>
                <label class="form-label small">Quantité (kg)</label>
                <input
                  class="form-control form-control-sm"
                  type="number"
                  min="1"
                  step="1"
                  [(ngModel)]="draft.quantityKg"
                  name="lotQty"
                />
              </div>
              <div>
                <label class="form-label small">Lieu / entrepôt</label>
                <input class="form-control form-control-sm" [(ngModel)]="draft.location" name="lotLoc" />
              </div>
              <div>
                <label class="form-label small">Image (URL, optionnel)</label>
                <input class="form-control form-control-sm" [(ngModel)]="draft.imageUrl" name="lotImg" />
              </div>
              <button type="submit" class="btn btn-success btn-sm">Publier le lot</button>
            </form>
            <p class="text-muted small mt-3 mb-0">
              <strong>Stockage local navigateur</strong> (pas la base « matching » donneur). Les lots publiés
              apparaissent dans l’espace recycleur. La quantité n’est déduite qu’après votre
              <strong>acceptation</strong> d’une demande.
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
              <span class="d-block mt-2">
                Astuce : les demandes sur les <strong>lots NutriFlow</strong> (pas le catalogue admin seul) arrivent ici.
                Même navigateur que le recycleur ; si vous aviez déjà la page ouverte, elle se met à jour quand une
                demande est enregistrée (autre onglet ou retour sur cette page).
              </span>
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
            <span><i class="bi bi-box-seam me-2 text-success"></i>Mes lots &amp; produits</span>
            <button type="button" class="btn btn-outline-secondary btn-sm" (click)="reload()">Rafraîchir</button>
          </div>
          <div class="card-body p-0">
            <div *ngIf="myLots.length === 0" class="p-4 text-muted small">
              Aucun lot. Ajoutez-en un avec le formulaire à gauche.
            </div>
            <div class="table-responsive" *ngIf="myLots.length > 0">
              <table class="table table-sm mb-0 align-middle">
                <thead class="table-light">
                  <tr>
                    <th>Nom</th>
                    <th>Catégorie</th>
                    <th>Stock (kg)</th>
                    <th>Lieu</th>
                    <th>Visibilité</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let lot of myLots">
                    <td>{{ lot.name }}</td>
                    <td>{{ lot.category }}</td>
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
    `
  ]
})
export class DonorValorisationWorkspaceComponent implements OnInit, OnDestroy {
  myLots: DonorLotRecord[] = [];
  allRequests: RecyclerRequest[] = [];
  pendingIncoming: RecyclerRequest[] = [];

  draft = {
    name: '',
    category: '',
    quantityKg: 10,
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
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, this.onRequestsSynced);
      window.addEventListener('storage', this.onStorage);
      window.addEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onHubPulled);
    }

    if (!this.auth.getCurrentUser()) {
      this.auth.fetchUserProfile().subscribe({
        next: () => this.reload(),
        error: () => {
          this.formError = 'Impossible de charger le profil. Reconnectez-vous.';
        }
      });
      return;
    }
    this.reload();
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, this.onRequestsSynced);
      window.removeEventListener('storage', this.onStorage);
      window.removeEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onHubPulled);
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

  addLot(): void {
    this.formError = '';
    this.formSuccess = '';

    const key = this.auth.getNutriflowOwnerKeyForNewRecords();
    if (key === 'local:anonymous') {
      this.formError =
        'Profil non chargé : reconnectez-vous ou ouvrez cette page depuis le dashboard une fois le profil chargé.';
      return;
    }

    const name = (this.draft.name ?? '').trim();
    const category = (this.draft.category ?? '').trim();
    const location = (this.draft.location ?? '').trim();
    const qty = Number(this.draft.quantityKg);

    if (!name || !category || !location) {
      this.formError = 'Renseignez le nom, la catégorie et le lieu.';
      return;
    }
    if (!Number.isFinite(qty) || qty < 1) {
      this.formError = 'Indiquez une quantité d’au moins 1 kg.';
      return;
    }

    try {
      const lots = loadAllDonorLots();
      const rec: DonorLotRecord = {
        id: nextDonorLotId(),
        donorUserKey: key,
        name,
        category,
        quantityKg: Math.floor(qty),
        location,
        imageUrl: (this.draft.imageUrl ?? '').trim() || undefined,
        listingStatus: 'listed'
      };
      lots.push(rec);
      saveAllDonorLots(lots);
      this.draft = { name: '', category: '', quantityKg: 10, location: '', imageUrl: '' };
      this.reload();
      this.formSuccess = 'Lot enregistré (stockage navigateur).';
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

    /** Après accord donateur : prêt pour collecte / « Declare done » (même statut que les demandes catalogue déjà « available »). */
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
