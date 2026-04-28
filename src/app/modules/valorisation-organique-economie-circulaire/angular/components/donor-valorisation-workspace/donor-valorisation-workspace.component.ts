import { Component, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { AuthService } from '../../../../gestion-user/services/auth.service';
import { LotService } from '../../../../gestion-donneur-matching/services/lot.service';
import { LotResponse } from '../../../../gestion-donneur-matching/models/lot.model';
import type { DonorLotRecord } from '../../models/donor-lots.model';
import type { RecyclerRequest } from '../../models/recycler-operations.model';
import { DonorLotsService } from '../../services/donor-lots.service';
import { NutriflowRecyclerRequestsService } from '../../services/nutriflow-recycler-requests.service';
import { NUTRIFLOW_HUB_PULLED_EVENT } from '../../services/nutriflow-hub-sync.service';
import { NutriflowInferenceService } from '../../services/nutriflow-inference.service';
import type { NutriflowClassificationResult } from '../../models/nutriflow-inference.model';

@Component({
  selector: 'app-donor-valorisation-workspace',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, DatePipe, RouterLink],
  templateUrl: './donor-valorisation-workspace.component.html',
  styleUrls: ['./donor-valorisation-workspace.component.scss']
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
    if (event.key === NutriflowRecyclerRequestsService.STORAGE_KEY) {
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
    private donorLots: DonorLotsService,
    private recyclerRequests: NutriflowRecyclerRequestsService,
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
    return `${l.nombreProduits} produit(s) — ${l.statut} — ${l.niveauUrgence}`;
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
      window.addEventListener(NutriflowRecyclerRequestsService.CHANGED_EVENT, this.onRequestsSynced);
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
      window.removeEventListener(NutriflowRecyclerRequestsService.CHANGED_EVENT, this.onRequestsSynced);
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
    this.myLots = this.donorLots.findForDonorKeys(aliases);
    this.allRequests = this.recyclerRequests.getAll();
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
      const lots = this.donorLots.getAll();
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

      const name = `Offre recyclage — ${lot.nombreProduits} produit(s) — ${lot.statut}`;
      const category = String(lot.niveauUrgence ?? 'LOT_DONATEUR');

      const record: DonorLotRecord = {
        id: existingIdx >= 0 ? lots[existingIdx].id : this.donorLots.allocateNextId(),
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
      this.donorLots.saveAll(lots);
      this.clearPhotoState();
      this.reload();
      this.formSuccess = 'Lot publié : visible par les recycleurs.';
      window.setTimeout(() => (this.formSuccess = ''), 4000);
    } catch (e) {
      this.formError =
        'Impossible d’enregistrer (quota navigateur, mode privé, ou données corrompues). Essayez un autre navigateur ou videz un peu le stockage.';
      console.error('donorLots.saveAll', e);
    }
  }

  toggleList(lot: DonorLotRecord): void {
    const aliases = new Set(this.auth.getNutriflowUserKeyAliases());
    if (!aliases.has(lot.donorUserKey)) {
      return;
    }
    const lots = this.donorLots.getAll();
    const idx = lots.findIndex((l) => l.id === lot.id);
    if (idx < 0) {
      return;
    }
    lots[idx] = {
      ...lots[idx],
      listingStatus: lots[idx].listingStatus === 'listed' ? 'paused' : 'listed'
    };
    this.donorLots.saveAll(lots);
    this.reload();
  }

  removeLot(lot: DonorLotRecord): void {
    const aliases = new Set(this.auth.getNutriflowUserKeyAliases());
    if (!aliases.has(lot.donorUserKey) || lot.quantityKg > 0) {
      return;
    }
    const lots = this.donorLots.getAll().filter((l) => l.id !== lot.id);
    this.donorLots.saveAll(lots);
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
    const lots = this.donorLots.getAll();
    const idx = lots.findIndex((l) => l.id === r.donorLotId && aliases.has(l.donorUserKey));
    if (idx < 0 || lots[idx].quantityKg < r.quantityKg) {
      return;
    }
    lots[idx] = { ...lots[idx], quantityKg: lots[idx].quantityKg - r.quantityKg };
    this.donorLots.saveAll(lots);

    const nextStatus = 'available' as const;

    const updated = this.recyclerRequests.getAll().map((req) =>
      req.id === r.id
        ? {
            ...req,
            status: nextStatus
          }
        : req
    );
    this.recyclerRequests.saveAll(updated);
    this.reload();
  }

  rejectRequest(r: RecyclerRequest): void {
    const aliases = new Set(this.auth.getNutriflowUserKeyAliases());
    if (r.donorUserKey == null || !aliases.has(r.donorUserKey) || r.status !== 'awaiting_donor') {
      return;
    }
    const updated = this.recyclerRequests.getAll().map((req) =>
      req.id === r.id
        ? {
            ...req,
            status: 'rejected' as const,
            managerComment: 'Refusé par le donateur'
          }
        : req
    );
    this.recyclerRequests.saveAll(updated);
    this.reload();
  }
}
