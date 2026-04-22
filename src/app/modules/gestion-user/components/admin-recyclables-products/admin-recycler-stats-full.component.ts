import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardLayoutComponent } from '../../../valorisation-organique-economie-circulaire/dashboard-layout.component';

@Component({
  selector: 'app-admin-recycler-stats-full',
  standalone: true,
  imports: [RouterLink, DashboardLayoutComponent],
  template: `
    <div class="container-fluid mt-3 mb-4">
      <nav class="d-flex flex-wrap justify-content-between align-items-center gap-2 px-2 mb-3">
        <span class="h5 text-success mb-0">
          <i class="bi bi-graph-up-arrow me-2"></i>Statistiques recycleurs — plein écran
        </span>
        <a routerLink="/user/admin/recycler-products" class="btn btn-outline-secondary btn-sm">
          <i class="bi bi-arrow-left"></i> Retour aux produits recyclables
        </a>
      </nav>
      <app-dashboard-layout [statsOnly]="true"></app-dashboard-layout>
    </div>
  `
})
export class AdminRecyclerStatsFullComponent {}
