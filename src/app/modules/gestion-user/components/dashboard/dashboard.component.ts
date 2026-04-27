import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

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
export class DashboardComponent implements OnInit {
  roles: string[] = [];
  username: string = '';
  currentUser: any = null;
  get isBlocked(): boolean { return this.authService.isBlocked; }
  activeTab: 'dashboard' | 'profile' | 'admin' = 'dashboard';

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
    private fb: FormBuilder,
    private router: Router,
    sanitizer: DomSanitizer
  ) {
    this.nutriflowRecyclerVideoUrl = sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.youtube.com/embed/xpAnLXc_bIU?autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1'
    );
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      // Rôles Keycloak disponibles tout de suite ; le profil /me affine (rôle DB).
      this.syncRolesFromAuth();
      this.authService.fetchUserProfile().subscribe({
        next: (user) => {
          this.currentUser = user;
          this.username = this.authService.getUsername();
          this.syncRolesFromAuth();
          this.initProfileForm();
          if (this.hasRole('ADMIN')) {
            this.loadAllUsers();
          }
        },
        error: (err) => console.error('Error fetching profile', err)
      });
      this.initPasswordForm();
    }
  }

  private syncRolesFromAuth(): void {
    this.roles = this.authService.getUserRoles();
  }

  initProfileForm() {
    if (!this.currentUser) return;
    this.profileForm = this.fb.group({
      nom: [this.currentUser.nom, Validators.required],
      prenom: [this.currentUser.prenom, Validators.required],
      telephone: [this.currentUser.telephone, Validators.required],
      address: [this.currentUser.address, Validators.required]
    });
  }

  initPasswordForm() {
    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
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
    if(confirm('Êtes-vous sûr de vouloir supprimer définitivement votre compte ?')) {
      this.authService.deleteAccount(this.currentUser.idUser).subscribe({
        next: () => {
          this.authService.logout();
          this.router.navigate(['/user/home']);
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


  changePassword() {
    if (this.passwordForm.invalid) return;
    this.passMessage = '';
    this.passError = '';

    const newPass = this.passwordForm.get('newPassword')?.value;
    this.authService.changePassword(newPass).subscribe({
      next: () => {
        this.passMessage = 'Votre mot de passe a été mis à jour dans Keycloak.';
        this.passwordForm.reset();
      },
      error: (err) => {
        console.error(err);
        this.passError = 'Erreur lors du changement de mot de passe.';
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
}
