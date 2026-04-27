import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../gestion-user/services/auth.service';

@Component({
  selector: 'app-donor-valorisation-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  template: `
    <div class="container mt-4">
      <nav
        class="navbar navbar-light bg-light rounded shadow-sm p-3 mb-4 d-flex flex-wrap justify-content-between align-items-center gap-3"
      >
        <div class="d-flex align-items-center flex-wrap gap-2">
          <a routerLink="/user/dashboard" class="navbar-brand mb-0 h4 text-success text-decoration-none">
            <i class="bi bi-gift me-2"></i>NutriFlow donateur
          </a>
          <span class="text-muted small d-none d-sm-inline">· Lots &amp; demandes recycleurs</span>
        </div>
        <div class="d-flex align-items-center flex-wrap gap-2">
          <span class="me-1 fw-bold text-dark small">Bienvenue, {{ username }} !</span>
          <a routerLink="/user/dashboard" class="btn btn-outline-success btn-sm">
            <i class="bi bi-speedometer2"></i> Dashboard
          </a>
          <a
            *ngIf="canOpenRecyclerArea"
            routerLink="/valorisation/nutriflow/requests"
            class="btn btn-outline-secondary btn-sm"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            <i class="bi bi-recycle"></i> Espace recycleur
          </a>
          <button type="button" class="btn btn-outline-danger btn-sm" (click)="logout()">
            <i class="bi bi-box-arrow-right me-1"></i>Déconnexion
          </button>
        </div>
      </nav>
      <router-outlet />
    </div>
  `
})
export class DonorValorisationShellComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const check = (): void => {
      const roles = this.authService.getUserRoles();
      const allowed = roles.includes('DONOR') || roles.includes('ADMIN');
      if (!allowed) {
        void this.router.navigate(['/user/dashboard']);
      }
    };

    if (this.authService.getCurrentUser()) {
      check();
      return;
    }

    this.authService.fetchUserProfile().subscribe({
      next: () => check(),
      error: () => void this.router.navigate(['/user/home'])
    });
  }

  get username(): string {
    return this.authService.getUsername();
  }

  /** Admin / recycleur peut aussi ouvrir la vue recycleur depuis ce shell. */
  get canOpenRecyclerArea(): boolean {
    const roles = this.authService.getUserRoles();
    return roles.some((r) => ['RECYCLER', 'ADMIN'].includes(r));
  }

  logout(): void {
    this.authService.logout();
  }
}
