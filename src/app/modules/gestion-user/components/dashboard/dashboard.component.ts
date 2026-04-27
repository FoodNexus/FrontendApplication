import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { InspectionCaseService } from '../../../audit-conformite-contrat-numerique/services/inspection-case.service';
import { RecyclingProductsService } from '../../../audit-conformite-contrat-numerique/services/recycling-products.service';
import { InspectionCase } from '../../../audit-conformite-contrat-numerique/models/inspection-case.model';
import { RecyclingProducts } from '../../../audit-conformite-contrat-numerique/models/recycling-products.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
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

  // Password Change
  passwordForm!: FormGroup;
  passMessage = '';
  passError = '';

  constructor(
    private authService: AuthService,
    private insCaseService: InspectionCaseService,
    private recyclingService: RecyclingProductsService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.authService.fetchUserProfile().subscribe({
        next: (user) => {
          this.currentUser = user;
          this.username = this.authService.getUsername();
          this.roles = this.authService.getUserRoles();
          this.initProfileForm();
          if (this.hasRole('ADMIN')) {
            this.loadAllUsers();
          }
          if (this.hasRole('AUDITOR')) {
            this.loadAuditorActivity();
          }
        },
        error: (err) => console.error('Error fetching profile', err)
      });
      this.initPasswordForm();
    }
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
    return this.roles.includes(role);
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
