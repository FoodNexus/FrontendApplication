import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../gestion-user/services/auth.service';
import { RecyclerCreditsDashboardComponent } from './recycler-credits-dashboard.component';

@Component({
  selector: 'app-nutriflow-recycler-home',
  standalone: true,
  imports: [NgIf, RouterLink, RecyclerCreditsDashboardComponent],
  template: `
    <div class="recycler-home py-2 pb-4">
      <app-recycler-credits-dashboard *ngIf="isRecyclerCreditsUser" />

      <div class="row g-3 mt-1">
        <div class="col-12 col-lg-6" *ngIf="isRecyclerCreditsUser">
          <div class="card border-success border-opacity-25 shadow-sm h-100">
            <div class="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <h3 class="h5 mb-1 text-success">Continuer vers vos demandes</h3>
                <p class="text-muted small mb-0">
                  Créer une demande, suivre l’état des lots donateurs et consulter l’historique des crédits détaillé.
                </p>
              </div>
              <a routerLink="/valorisation/nutriflow/requests" class="btn btn-success px-4">
                <i class="bi bi-recycle me-2"></i>Mes demandes &amp; inventaire
              </a>
            </div>
          </div>
        </div>

        <div class="col-12" *ngIf="!isRecyclerCreditsUser">
          <div class="card border-warning border-opacity-50 shadow-sm">
            <div class="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <h3 class="h5 mb-1 text-dark">Espace administrateur NutriFlow</h3>
                <p class="text-muted small mb-0">
                  Les crédits fidélité s’affichent sur l’accueil recycleur. Ouvrez la gestion des demandes pour attribuer
                  les lots et suivre les flux.
                </p>
              </div>
              <a routerLink="/valorisation/nutriflow/requests" class="btn btn-warning text-dark px-4">
                <i class="bi bi-gear me-2"></i>Gestion des demandes
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NutriFlowRecyclerHomeComponent {
  constructor(protected authService: AuthService) {}

  get isRecyclerCreditsUser(): boolean {
    return this.authService.hasRole('RECYCLER') && !this.authService.hasRole('ADMIN');
  }
}
