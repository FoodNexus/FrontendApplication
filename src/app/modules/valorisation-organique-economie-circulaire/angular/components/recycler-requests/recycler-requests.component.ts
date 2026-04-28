import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { RecyclableProduct, RecyclerRequest, RequestStatus } from '../../models/recycler-operations.model';
import type { DonorLotRecord } from '../../models/donor-lots.model';
import { DonorLotsService } from '../../services/donor-lots.service';
import { NutriflowRecyclerRequestsService } from '../../services/nutriflow-recycler-requests.service';
import { RecyclerCreditsService } from '../../services/recycler-credits.service';
import { NUTRIFLOW_HUB_PULLED_EVENT } from '../../services/nutriflow-hub-sync.service';
import { AuthService } from '../../../../gestion-user/services/auth.service';
import { RecyclerRequestsStatsPanelComponent } from '../recycler-requests-stats-panel/recycler-requests-stats-panel.component';
import { NutriflowRecyclerPlanetStairsComponent } from '../nutriflow-recycler-planet-stairs/nutriflow-recycler-planet-stairs.component';

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
  templateUrl: './recycler-requests.component.html',
  styleUrls: ['./recycler-requests.component.scss']
})
export class RecyclerRequestsComponent implements OnInit, OnDestroy {
  /** Exposé au template pour les actions admin (crédit). */
  protected readonly isNutriflowAdminCreditVerifiableStatus = (status: RequestStatus): boolean =>
    this.recyclerRequests.isAdminCreditVerifiable(status);

  protected products: RecyclableProduct[] = [];
  protected requests: RecyclerRequest[] = [];

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
  private nextRequestId = 1001;

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
    private ngZone: NgZone,
    private donorLots: DonorLotsService,
    private recyclerRequests: NutriflowRecyclerRequestsService
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
      window.addEventListener(DonorLotsService.MUTATED_EVENT, this.onDonorLotsMutated);
      window.addEventListener(NutriflowRecyclerRequestsService.CHANGED_EVENT, this.onRecyclerRequestsExternalChange);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onHubPulled);
      window.removeEventListener(DonorLotsService.MUTATED_EVENT, this.onDonorLotsMutated);
      window.removeEventListener(NutriflowRecyclerRequestsService.CHANGED_EVENT, this.onRecyclerRequestsExternalChange);
    }
  }

  private refreshFromStorage(): void {
    this.requests = this.recyclerRequests.getAll();
    this.products = this.getProductsFromAdmin();
    this.allDonorLotsAdmin = [...this.donorLots.getAll()].sort((a, b) => b.id - a.id);
    this.nextRequestId =
      this.requests.length > 0 ? Math.max(...this.requests.map((entry) => entry.id)) + 1 : 1001;
  }

  /** Liste admin : demandes les plus récentes d’abord. */
  protected get adminRequestsSorted(): RecyclerRequest[] {
    return [...this.requests].sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  /** Demandes du recycleur courant — pour le tableau hors admin. */
  protected get recyclerRequestsSorted(): RecyclerRequest[] {
    const key = this.creditsService.getCurrentRecyclerKey();
    return [...this.requests]
      .filter((r) => !r.recyclerUserKey || r.recyclerUserKey === key)
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
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
    if (!this.recyclerRequests.isAdminCreditVerifiable(r.status)) {
      return;
    }
    this.refreshFromStorage();
    const userKey = r.recyclerUserKey ?? 'local:anonymous';
    this.requests = this.requests.map((x) =>
      x.id === r.id && this.recyclerRequests.isAdminCreditVerifiable(x.status)
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
    if (!this.recyclerRequests.isAdminCreditVerifiable(r.status)) {
      return;
    }
    this.refreshFromStorage();
    const note = (this.adminRejectNotes[r.id] ?? '').trim() || 'Rejet administrateur';
    this.requests = this.requests.map((x) =>
      x.id === r.id && this.recyclerRequests.isAdminCreditVerifiable(x.status)
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
    const lots = this.donorLots.getAll();
    const idx = lots.findIndex((l) => l.id === lot.id);
    if (idx < 0) {
      return;
    }
    const q = Math.max(0, Math.floor(Number(lot.quantityKg) || 0));
    lots[idx] = { ...lots[idx], quantityKg: q };
    this.donorLots.saveAll(lots);
    this.refreshFromStorage();
  }

  protected adminToggleDonorLotListing(lot: DonorLotRecord): void {
    const lots = this.donorLots.getAll();
    const idx = lots.findIndex((l) => l.id === lot.id);
    if (idx < 0) {
      return;
    }
    const next: DonorLotRecord['listingStatus'] =
      lots[idx].listingStatus === 'listed' ? 'paused' : 'listed';
    lots[idx] = { ...lots[idx], listingStatus: next };
    this.donorLots.saveAll(lots);
    this.refreshFromStorage();
  }

  protected adminDeleteDonorLot(lot: DonorLotRecord): void {
    if (!confirm('Supprimer ce lot du stockage NutriFlow (local) ?')) {
      return;
    }
    const lots = this.donorLots.getAll().filter((l) => l.id !== lot.id);
    this.donorLots.saveAll(lots);
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
    this.requests = this.recyclerRequests.getAll();
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
      const lotRow = this.donorLots.getById(donorLotId);
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
    return this.donorLots.findListedForRecycler().map<RecyclableProduct>((lot) => ({
      id: DonorLotsService.DONOR_LOT_PRODUCT_ID_BASE + lot.id,
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
    const allDonor = this.donorLots.getAll();
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
      this.donorLots.saveAll(allDonor);
    }
  }

  private persistRequests(): void {
    this.recyclerRequests.saveAll(this.requests);
  }
}
