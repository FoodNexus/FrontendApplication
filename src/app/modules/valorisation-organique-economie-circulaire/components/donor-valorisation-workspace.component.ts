import { Component, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
import { NutriflowInferenceService } from '../services/nutriflow-inference.service';
import type { NutriflowClassificationResult } from '../services/nutriflow-inference.service';

@Component({
  selector: 'app-donor-valorisation-workspace',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, DatePipe, RouterLink],
  template: `
    <section class="mb-4">
      <div class="p-4 rounded text-white hero">
        <div class="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div>
            <h2 class="h4 mb-1">Espace donateur NutriFlow</h2>
            <p class="mb-0 small opacity-90">
              Publiez vos lots et traitez les demandes des recycleurs.
            </p>
          </div>
        </div>
      </div>
    </section>

    <div class="row g-4 mb-4">
      <div class="col-lg-4">
        <div class="card shadow-sm border-0 h-100 donor-side-panel">
          <div class="card-body p-3 d-flex flex-column">
            <h3 class="h6 fw-semibold text-success mb-2">
              <i class="bi bi-play-btn me-1"></i>Présentation NutriFlow
            </h3>
            <div class="donor-video-wrap w-100">
              <div class="ratio ratio-16x9 rounded overflow-hidden border shadow-sm">
                <iframe
                  [src]="donorIntroVideoUrl"
                  title="NutriFlow — présentation"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                  loading="lazy"
                ></iframe>
              </div>
            </div>
            <div class="mt-3 p-3 rounded bg-success bg-opacity-10 border border-success border-opacity-25 flex-grow-1">
              <p class="small text-muted mb-0">
                Ajoutez une photo lors de la publication : nous estimons la part recyclable et organique, et les filières
                possibles, visibles par les recycleurs.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-8">
        <div class="card shadow-sm h-100 publish-lot-card">
          <div class="card-header bg-white fw-semibold">
            <i class="bi bi-plus-circle me-2 text-success"></i>Publier un lot pour le recyclage
          </div>
          <div class="card-body publish-card-body">
            <div *ngIf="formError" class="alert alert-warning small py-2 mb-3">{{ formError }}</div>
            <div *ngIf="formSuccess" class="alert alert-success small py-2 mb-3">{{ formSuccess }}</div>
            <div *ngIf="matchingError" class="alert alert-danger small py-2 mb-3">{{ matchingError }}</div>
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
                <label class="form-label small">Photo du déchet (recommandé)</label>
                <input
                  type="file"
                  class="form-control form-control-sm"
                  accept="image/*"
                  (change)="onWastePhotoSelected($event)"
                />
                <div class="d-flex flex-wrap gap-2 align-items-center mt-2">
                  <button
                    type="button"
                    class="btn btn-outline-success btn-sm"
                    [disabled]="!photoFile || photoAnalyzing"
                    (click)="runPhotoAnalysis()"
                  >
                    <span *ngIf="!photoAnalyzing"><i class="bi bi-search me-1"></i>Analyser la photo</span>
                    <span *ngIf="photoAnalyzing" class="spinner-border spinner-border-sm" role="status"></span>
                    <span *ngIf="photoAnalyzing" class="ms-1">Analyse…</span>
                  </button>
                  <span *ngIf="photoFile && !photoAnalysis && !photoAnalyzing" class="text-warning small"
                    >Analysez la photo avant publication.</span
                  >
                </div>
                <p *ngIf="photoError" class="text-danger small mt-2 mb-0">{{ photoError }}</p>
              </div>
              <div *ngIf="photoAnalysis" class="border rounded p-3 bg-light small">
                <p class="fw-semibold text-success mb-2">Aperçu de l’analyse (sera visible par les recycleurs)</p>
                <div class="mb-2">
                  <div class="d-flex justify-content-between"><span>Recyclable</span><strong>{{ aiRecyclablePct() }} %</strong></div>
                  <div class="progress" style="height: 8px">
                    <div class="progress-bar bg-success" [style.width.%]="aiRecyclablePct()"></div>
                  </div>
                </div>
                <div class="mb-2">
                  <div class="d-flex justify-content-between"><span>Organique</span><strong>{{ aiOrganicPct() }} %</strong></div>
                  <div class="progress bg-light" style="height: 8px">
                    <div class="progress-bar bg-secondary" [style.width.%]="aiOrganicPct()"></div>
                  </div>
                </div>
                <p class="mb-0">{{ aiSummaryForDonor() }}</p>
                <ul *ngIf="photoAnalysis.filieres?.length" class="mb-0 ps-3">
                  <li *ngFor="let f of photoAnalysis.filieres">
                    {{ filiereDisplay(f.code) }} — {{ filierePct(f.score) }} %
                    <span *ngIf="f.notes" class="text-muted">({{ f.notes }})</span>
                  </li>
                </ul>
              </div>
              <button type="submit" class="btn btn-success btn-sm" [disabled]="matchingLots.length === 0">
                Publier pour les recycleurs
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-12">
        <div class="card shadow-sm">
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
      </div>

      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header bg-white fw-semibold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-box-seam me-2 text-success"></i>Mes offres recyclage</span>
            <button type="button" class="btn btn-outline-secondary btn-sm" (click)="refreshAll()">Rafraîchir</button>
          </div>
          <div class="card-body p-0">
            <div *ngIf="myLots.length === 0" class="p-4 text-muted small">
              Aucune offre publiée. Sélectionnez un lot matching ci-dessus.
            </div>
            <div class="table-responsive" *ngIf="myLots.length > 0">
              <table class="table table-sm mb-0 align-middle">
                <thead class="table-light">
                  <tr>
                    <th>Nom</th>
                    <th>Catégorie</th>
                    <th>Filières</th>
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
                    <td class="small">{{ lot.category }}</td>
                    <td class="small text-muted">{{ filieresLabel(lot) }}</td>
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
      .donor-video-wrap {
        max-width: 340px;
      }
      @media (min-width: 992px) {
        .donor-video-wrap {
          max-width: 100%;
        }
      }
      .donor-side-panel iframe {
        border: 0;
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
  selectedMatchingLotId: number | null = null;
  readonly donorIntroVideoUrl: SafeResourceUrl;
  /** Native select inside grid/card can fail to open in some browsers — custom menu instead. */
  lotPickerOpen = false;

  publishDraft = {
    quantityKg: 1,
    location: ''
  };

  /** Photo à envoyer au modèle (publication lot). */
  photoFile: File | null = null;
  photoAnalysis: NutriflowClassificationResult | null = null;
  photoAnalyzing = false;
  photoError = '';

  private static readonly FILIERE_LABELS: Record<string, string> = {
    METHANISATION: 'Méthanisation',
    COMPOST: 'Compostage',
    TRI_SELECTIF: 'Tri sélectif (recyclage)',
    VALORISATION_MATIERE: 'Valorisation des matériaux'
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
    private ngZone: NgZone,
    private inference: NutriflowInferenceService,
    sanitizer: DomSanitizer
  ) {
    this.donorIntroVideoUrl = sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.youtube.com/embed/xpAnLXc_bIU?rel=0&modestbranding=1&playsinline=1'
    );
  }

  filieresLabel(lot: DonorLotRecord): string {
    const f = lot.classificationFilieres;
    return f?.length ? f.join(', ') : '—';
  }

  onWastePhotoSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.photoFile = input.files?.[0] ?? null;
    this.photoAnalysis = null;
    this.photoError = '';
  }

  runPhotoAnalysis(): void {
    if (!this.photoFile) {
      return;
    }
    this.photoAnalyzing = true;
    this.photoError = '';
    this.inference.classifyImage(this.photoFile).subscribe({
      next: (r) => {
        this.photoAnalysis = r;
        this.photoAnalyzing = false;
      },
      error: (e) => {
        this.photoAnalyzing = false;
        this.photoError =
          e?.error?.detail ?? e?.message ?? "L'analyse n'a pas pu aboutir. Réessayez plus tard.";
      }
    });
  }

  aiRecyclablePct(): number {
    return this.pctFromAnalysis('R');
  }

  aiOrganicPct(): number {
    return this.pctFromAnalysis('O');
  }

  private pctFromAnalysis(code: string): number {
    const c = this.photoAnalysis?.categories.find((x) => x.label.toUpperCase() === code.toUpperCase());
    return c != null ? Math.round(c.score * 1000) / 10 : 0;
  }

  filiereDisplay(code: string): string {
    const k = (code ?? '').toUpperCase();
    if (DonorValorisationWorkspaceComponent.FILIERE_LABELS[k]) {
      return DonorValorisationWorkspaceComponent.FILIERE_LABELS[k];
    }
    return k
      .split('_')
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  }

  filierePct(score: number): number {
    return Math.round(Math.min(1, Math.max(0, score)) * 1000) / 10;
  }

  aiSummaryForDonor(): string {
    const r = this.aiRecyclablePct();
    const o = this.aiOrganicPct();
    if (r >= o && r - o >= 15) {
      return 'Estimation : plutôt recyclable — vérifiez l’emballage ou les consignes locales.';
    }
    if (o >= r && o - r >= 15) {
      return 'Estimation : plutôt organique — évitez de mélanger avec le recyclage si vous doutez.';
    }
    return 'Estimation : cas limite entre recyclable et organique — demandez conseil localement.';
  }

  private buildAiForLot():
    | {
        description: string;
        filieres: string[];
        rPct: number;
        oPct: number;
      }
    | undefined {
    if (!this.photoAnalysis) {
      return undefined;
    }
    const rPct = this.aiRecyclablePct();
    const oPct = this.aiOrganicPct();
    const filieres = (this.photoAnalysis.filieres ?? []).map(
      (f) => `${this.filiereDisplay(f.code)} — ${this.filierePct(f.score)} %`
    );
    return {
      description: this.aiSummaryForDonor(),
      filieres,
      rPct,
      oPct
    };
  }

  private async fileToResizedDataUrl(file: File): Promise<string | undefined> {
    return new Promise((resolve) => {
      const img = new Image();
      const u = URL.createObjectURL(file);
      img.onload = (): void => {
        URL.revokeObjectURL(u);
        const maxW = 480;
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w <= 0 || h <= 0) {
          resolve(undefined);
          return;
        }
        if (w > maxW) {
          h = (h * maxW) / w;
          w = maxW;
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w);
        canvas.height = Math.round(h);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(undefined);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = (): void => {
        URL.revokeObjectURL(u);
        resolve(undefined);
      };
      img.src = u;
    });
  }

  private clearPhotoState(): void {
    this.photoFile = null;
    this.photoAnalysis = null;
    this.photoError = '';
  }

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
      return;
    }
    this.loadingMatching = true;
    this.matchingError = '';
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

  async publishLot(): Promise<void> {
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

    if (this.photoFile && !this.photoAnalysis) {
      this.formError = 'Cliquez sur « Analyser la photo » avant de publier, ou retirez la photo.';
      return;
    }

    try {
      const lots = loadAllDonorLots();
      const existingIdx = lots.findIndex((l) => l.donorUserKey === key && l.matchingLotId === lot.idLot);
      const prev = existingIdx >= 0 ? lots[existingIdx] : null;

      let imageUrl: string | undefined;
      if (this.photoFile) {
        imageUrl = (await this.fileToResizedDataUrl(this.photoFile)) ?? undefined;
      } else if (prev?.imageUrl) {
        imageUrl = prev.imageUrl;
      }

      const ai = this.photoFile ? this.buildAiForLot() : undefined;

      const aiDescription = ai?.description ?? prev?.classificationDescription;
      const aiFilieres =
        ai?.filieres ??
        (prev?.classificationFilieres?.length ? [...prev.classificationFilieres] : undefined);
      const aiRPct = ai?.rPct ?? prev?.aiRecyclablePercent;
      const aiOPct = ai?.oPct ?? prev?.aiOrganicPercent;

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
        imageUrl,
        listingStatus: 'listed',
        classificationDescription: aiDescription,
        classificationFilieres: aiFilieres,
        aiRecyclablePercent: aiRPct,
        aiOrganicPercent: aiOPct
      };

      if (existingIdx >= 0) {
        lots[existingIdx] = { ...lots[existingIdx], ...record, id: lots[existingIdx].id };
      } else {
        lots.push(record);
      }
      saveAllDonorLots(lots);
      this.clearPhotoState();
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
