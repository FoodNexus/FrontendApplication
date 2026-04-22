import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../gestion-user/services/auth.service';
import { RecyclerCreditsService } from './services/recycler-credits.service';

@Component({
  selector: 'app-nutriflow-recycler-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  template: `
    <div class="container mt-4">
      <nav class="navbar navbar-light bg-light rounded shadow-sm p-3 mb-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="d-flex align-items-center flex-wrap gap-2">
          <a routerLink="/user/dashboard" class="navbar-brand mb-0 h4 text-success text-decoration-none">
            <i class="bi bi-speedometer2 me-2"></i>NutriFlow
          </a>
          <span class="text-muted small d-none d-sm-inline">· Valorisation organique</span>
        </div>
        <div class="d-flex align-items-center flex-wrap gap-2">
          <span class="me-1 fw-bold text-dark small">Bienvenue, {{ username }} !</span>
          <a
            routerLink="/user/dashboard"
            class="btn btn-outline-success btn-sm"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            <i class="bi bi-speedometer2"></i> Dashboard
          </a>
          <a
            routerLink="/user/recycler"
            class="btn btn-outline-secondary btn-sm"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            <i class="bi bi-recycle"></i> Demandes
          </a>
          <span class="badge bg-success rounded-pill px-3 py-2">
            Crédits : {{ creditsService.getBalance() }}
          </span>
          <a
            *ngIf="authService.hasRole('ADMIN')"
            routerLink="/user/admin/recycler-verification"
            class="btn btn-outline-warning btn-sm"
          >
            <i class="bi bi-patch-check"></i> Admin validation
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
export class NutriFlowRecyclerShellComponent implements OnInit {
  constructor(
    protected authService: AuthService,
    protected creditsService: RecyclerCreditsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const roles = this.authService.getUserRoles();
    const canRecycler = roles.some((r) => ['RECYCLER', 'ADMIN'].includes(r));
    const isDonor = roles.includes('DONOR');
    if (isDonor && !canRecycler) {
      void this.router.navigateByUrl('/user/recycler/donor');
    }
  }

  get username(): string {
    return this.authService.getUsername();
  }

  logout(): void {
    this.authService.logout();
  }
}
