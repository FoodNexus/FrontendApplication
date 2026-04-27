import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import {
  isNutriflowAdminCreditVerifiableStatus,
  loadRecyclerRequests,
  RECYCLER_REQUESTS_CHANGED_EVENT
} from '../../../valorisation-organique-economie-circulaire/storage/recycler-operations.storage';
import { DONOR_LOTS_MUTATED_EVENT } from '../../../valorisation-organique-economie-circulaire/storage/donor-lots.storage';
import {
  RecyclerCreditsService,
  NUTRIFLOW_CREDITS_MUTATED_EVENT
} from '../../../valorisation-organique-economie-circulaire/services/recycler-credits.service';
import { InspectionCaseService } from '../../../audit-conformite-contrat-numerique/services/inspection-case.service';
import { RecyclingProductsService } from '../../../audit-conformite-contrat-numerique/services/recycling-products.service';
import { InspectionCase } from '../../../audit-conformite-contrat-numerique/models/inspection-case.model';
import { RecyclingProducts } from '../../../audit-conformite-contrat-numerique/models/recycling-products.model';

/** Grands acteurs du recyclage — données de démonstration (notes illustratives). */
interface RecyclerPartnerHighlight {
  name: string;
  country: string;
  /** Note sur 5 (ex. partenariat / qualité perçue). */
  rating: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  roles: string[] = [];
  username: string = '';
  currentUser: any = null;
  get isBlocked(): boolean { return this.authService.isBlocked; }
  activeTab: 'dashboard' | 'profile' | 'admin' = 'dashboard';

  // Auditor Activity
  recentInspections: InspectionCase[] = [];
  recentRecycling: RecyclingProducts[] = [];

  // Profile Form
  profileForm!: FormGroup;
  updateMessage = '';
  updateError = '';

  // Admin
  allUsers: any[] = [];
  adminMessage = '';

  /** Vue agrégée annuaire (tous rôles) pour graphiques admin. */
  adminUserOverview: {
    total: number;
    active: number;
    blocked: number;
    byRole: Record<string, number>;
  } = { total: 0, active: 0, blocked: 0, byRole: {} };

  adminRoleBarRows: { label: string; count: number; pct: number }[] = [];

  /** Instantané NutriFlow (stockage local) pour tuiles admin. */
  adminNutriSnap = {
    pendingVerification: 0,
    verified: 0,
    awaitingDonor: 0,
    totalCredits: 0,
    creditEvents: 0
  };

  readonly adminSpotlightImages: { src: string; alt: string; caption: string }[] = [
    {
      src: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=720&q=80',
      alt: 'Tri sélectif et bacs de collecte',
      caption: 'Tri et préparation des flux vers les filières adaptées.'
    },
    {
      src: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=720&q=80',
      alt: 'Bacs de collecte sélective',
      caption: 'Collecte sélective et traçabilité des matières.'
    },
    {
      src: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=720&q=80',
      alt: 'Feuillage et matière organique',
      caption: 'Valorisation organique — compost, méthanisation, circuits courts.'
    }
  ];

  private readonly boundNutriRefresh = (): void => {
    if (this.hasRole('ADMIN')) {
      this.refreshAdminNutriSnapshot();
    }
  };

  // Password Change
  passwordForm!: FormGroup;
  passMessage = '';
  passError = '';

  /** Présentation NutriFlow recycleur (lecture auto demandée au chargement du dashboard). */
  readonly nutriflowRecyclerVideoUrl: SafeResourceUrl;

  readonly recyclerPartners: RecyclerPartnerHighlight[] = [
    { name: 'Veolia', country: 'France', rating: 4.7 },
    { name: 'Suez', country: 'France', rating: 4.5 },
    { name: 'Republic Services', country: 'États-Unis', rating: 4.6 },
    { name: 'Waste Management', country: 'États-Unis', rating: 4.8 },
    { name: 'Renewi', country: 'Pays-Bas', rating: 4.4 },
    { name: 'Biffa', country: 'Royaume-Uni', rating: 4.3 }
  ];

  readonly starIndexes = [1, 2, 3, 4, 5] as const;

  constructor(
    private authService: AuthService,
    private insCaseService: InspectionCaseService,
    private recyclingService: RecyclingProductsService,
    private fb: FormBuilder,
    private router: Router,
    sanitizer: DomSanitizer,
    private creditsService: RecyclerCreditsService
  ) {
    this.nutriflowRecyclerVideoUrl = sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.youtube.com/embed/xpAnLXc_bIU?autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1'
    );
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      // Rôles Keycloak disponibles tout de suite ; le profil /me affine (rôle DB).
      this.syncRolesFromAuth();
      if (this.hasRole('ADMIN')) {
        this.refreshAdminNutriSnapshot();
        this.loadAdminDirectoryOverview();
      }
      this.authService.fetchUserProfile().subscribe({
        next: (user) => {
          this.currentUser = user;
          this.username = this.authService.getUsername();
          this.syncRolesFromAuth();
          this.initProfileForm();
          if (this.hasRole('ADMIN')) {
            this.loadAllUsers();
            this.loadAdminDirectoryOverview();
            this.refreshAdminNutriSnapshot();
          }
          if (this.hasRole('AUDITOR')) {
            this.loadAuditorActivity();
          }
        },
        error: (err) => console.error('Error fetching profile', err)
      });
      this.initPasswordForm();
      if (typeof window !== 'undefined') {
        window.addEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, this.boundNutriRefresh);
        window.addEventListener(DONOR_LOTS_MUTATED_EVENT, this.boundNutriRefresh);
        window.addEventListener(NUTRIFLOW_CREDITS_MUTATED_EVENT, this.boundNutriRefresh);
      }
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, this.boundNutriRefresh);
      window.removeEventListener(DONOR_LOTS_MUTATED_EVENT, this.boundNutriRefresh);
      window.removeEventListener(NUTRIFLOW_CREDITS_MUTATED_EVENT, this.boundNutriRefresh);
    }
  }

  @HostListener('window:storage', ['$event'])
  onWindowStorage(ev: StorageEvent): void {
    if (!this.hasRole('ADMIN')) {
      return;
    }
    if (ev.key == null || ev.key.includes('nutriflow') || ev.key.includes('receveur')) {
      this.refreshAdminNutriSnapshot();
    }
  }

  private loadAdminDirectoryOverview(): void {
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        const list = users ?? [];
        const byRole: Record<string, number> = {};
        let active = 0;
        let blocked = 0;
        for (const u of list) {
          const r = String(u.role ?? '—')
            .toUpperCase()
            .replace(/^ROLE_/, '');
          byRole[r] = (byRole[r] ?? 0) + 1;
          if (u.actif) {
            active++;
          } else {
            blocked++;
          }
        }
        this.adminUserOverview = { total: list.length, active, blocked, byRole };
        const entries = Object.entries(byRole);
        const max = Math.max(...entries.map(([, c]) => c), 1);
        this.adminRoleBarRows = entries
          .map(([label, count]) => ({ label, count, pct: Math.round((count / max) * 100) }))
          .sort((a, b) => b.count - a.count);
      },
      error: () => {
        this.adminUserOverview = { total: 0, active: 0, blocked: 0, byRole: {} };
        this.adminRoleBarRows = [];
      }
    });
  }

  private refreshAdminNutriSnapshot(): void {
    const req = loadRecyclerRequests();
    this.adminNutriSnap.pendingVerification = req.filter((r) =>
      isNutriflowAdminCreditVerifiableStatus(r.status)
    ).length;
    this.adminNutriSnap.verified = req.filter((r) => r.status === 'verified').length;
    this.adminNutriSnap.awaitingDonor = req.filter((r) => r.status === 'awaiting_donor').length;
    const ledger = this.creditsService.getAllLedger();
    this.adminNutriSnap.creditEvents = ledger.length;
    this.adminNutriSnap.totalCredits = ledger.reduce((s, e) => s + e.amount, 0);
  }

  protected adminRolePercent(_role: string, count: number): number {
    if (this.adminUserOverview.total < 1) {
      return 0;
    }
    return Math.round((count / this.adminUserOverview.total) * 100);
  }

  private syncRolesFromAuth(): void {
    this.roles = this.authService.getUserRoles();
  }

  initProfileForm() {
    if (!this.currentUser) return;
    this.profileForm = this.fb.group({
      nom: [this.currentUser.nom, Validators.required],
      prenom: [this.currentUser.prenom, Validators.required],
      telephone: [this.currentUser.telephone, [Validators.required, Validators.pattern('^[0-9]{8,15}$')]],
      address: [this.currentUser.address, Validators.required]
    });
  }

  initPasswordForm() {
    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator }); // ✅ 'validators' (pluriel) est requis par Angular
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  switchTab(tab: 'dashboard' | 'profile' | 'admin') {
    this.activeTab = tab;
  }

  updateProfile() {
    if (this.profileForm.invalid) return;
    this.updateMessage = '';
    this.updateError = '';
    
    this.authService.updateProfile(this.currentUser.idUser, this.profileForm.value).subscribe({
      next: (updatedUser) => {
        this.updateMessage = 'Profil mis à jour avec succès.';
        this.username = `${updatedUser.prenom} ${updatedUser.nom}`;
        this.currentUser = updatedUser;
      },
      error: (err) => {
        this.updateError = 'Erreur lors de la mise à jour.';
        console.error(err);
      }
    });
  }

  deleteAccount() {
    if(confirm('Voulez-vous envoyer une demande de clôture de compte à l\'administrateur ?')) {
      this.authService.requestAccountDeletion().subscribe({
        next: (response) => {
          alert(response);
          if (this.currentUser) {
            this.currentUser.deletionRequested = true;
          }
        },
        error: (err) => console.error(err)
      });
    }
  }

  // Admin Functions
  loadAllUsers() {
    this.authService.getAllUsers().subscribe({
      next: (users) => this.allUsers = users.filter(u => u.role !== 'ADMIN'),
      error: (err) => console.error(err)
    });
  }

  toggleUserStatus(user: any) {
    const newStatus = !user.actif;
    this.authService.toggleUserStatus(user.idUser, newStatus).subscribe({
      next: () => {
        user.actif = newStatus;
        this.adminMessage = `L'utilisateur ${user.email} a été ${newStatus ? 'débloqué' : 'bloqué'}.`;
        setTimeout(() => this.adminMessage = '', 3000);
      },
      error: (err) => console.error(err)
    });
  }

  approveDeletion(user: any) {
    if (confirm(`Confirmer la clôture définitive du compte de ${user.email} ?`)) {
      this.authService.approveAccountDeletion(user.idUser).subscribe({
        next: (res) => {
          this.adminMessage = res;
          this.loadAllUsers(); // Rafraîchir la liste
          setTimeout(() => this.adminMessage = '', 3000);
        },
        error: (err) => console.error(err)
      });
    }
  }


  changePassword() {
    if (this.passwordForm.invalid) return;
    this.passMessage = '';
    this.passError = '';

    const newPass = this.passwordForm.get('newPassword')?.value;
    this.authService.changePassword(newPass).subscribe({
      next: () => {
        this.passMessage = '✅ Votre mot de passe a été mis à jour avec succès.';
        this.passwordForm.reset();
      },
      error: (err) => {
        console.error('Password change error:', err);
        // Affiche le message d'erreur réel pour faciliter le diagnostic
        const detail = err?.error || err?.message || 'Erreur inconnue';
        this.passError = `❌ Échec du changement de mot de passe : ${detail}`;
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/user/home']);
  }

  hasRole(role: string): boolean {
    return this.roles.includes(role.toUpperCase());
  }

  partnerStarClass(rating: number, starIndex: number): string {
    if (rating >= starIndex) {
      return 'bi-star-fill';
    }
    if (rating >= starIndex - 0.5) {
      return 'bi-star-half';
    }
    return 'bi-star';
  }

  // Auditor Activity Logic
  loadAuditorActivity(): void {
    const userId = this.currentUser?.idUser;
    
    // 1. Fetch Latest 3 Personal Inspections
    this.insCaseService.getByAuditor(userId).subscribe(data => {
      this.recentInspections = (data || []).sort((a, b) => b.caseId! - a.caseId!).slice(0, 3);
    });

    // 2. Fetch Latest 3 Recycling Logs (Filtré par Auditor ID)
    this.recyclingService.getAll().subscribe(data => {
      this.recentRecycling = (data || [])
        .filter(r => r.inspectionCase?.auditorId === userId)
        .sort((a, b) => b.logId! - a.logId!)
        .slice(0, 3);
    });
  }

  // Helpers for Status/Verdict/Destination
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'EN_COURS': return 'badge-pill status-en-cours';
      case 'RESOLU':   return 'badge-pill status-resolu';
      case 'FERME':    return 'badge-pill status-ferme';
      default:         return 'badge-pill';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'EN_COURS': return 'bi-clock';
      case 'RESOLU':   return 'bi-check-circle';
      case 'FERME':    return 'bi-x-circle';
      default:         return 'bi-question-circle';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'EN_COURS': return 'En cours';
      case 'RESOLU':   return 'Résolu';
      case 'FERME':    return 'Fermé';
      default:         return status;
    }
  }

  getVerdictBadgeClass(verdict: string): string {
    switch (verdict) {
      case 'PROPRE_A_LA_CONSOMMATION': return 'badge-pill verdict-propre';
      case 'DESTRUCTION_RECYCLAGE':    return 'badge-pill verdict-recyclage';
      default:                          return 'badge-pill';
    }
  }

  getVerdictIcon(verdict: string): string {
    switch (verdict) {
      case 'PROPRE_A_LA_CONSOMMATION': return 'bi-shield-check';
      case 'DESTRUCTION_RECYCLAGE':    return 'bi-exclamation-triangle';
      default:                          return 'bi-question';
    }
  }

  getVerdictLabel(verdict: string): string {
    switch (verdict) {
      case 'PROPRE_A_LA_CONSOMMATION': return 'Consommable';
      case 'DESTRUCTION_RECYCLAGE':    return 'Recyclage';
      default:                          return verdict;
    }
  }

  getDestLabel(dest: string): string {
    switch (dest) {
      case 'COMPOST': return 'Compostage';
      case 'AGRICULTEUR': return 'Agriculteur';
      default: return dest || 'N/A';
    }
  }
}
