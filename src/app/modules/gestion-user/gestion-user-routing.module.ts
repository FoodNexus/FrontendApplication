import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CompleteProfileComponent } from './components/complete-profile/complete-profile.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  { path: 'complete-profile', component: CompleteProfileComponent },
  {
    path: 'admin/recycler-products/stats',
    loadComponent: () =>
      import('./components/admin-recyclables-products/admin-recycler-stats-full.component').then(
        (m) => m.AdminRecyclerStatsFullComponent
      ),
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/recycler-products',
    loadComponent: () =>
      import('./components/admin-recyclables-products/admin-recyclables-products.component').then(
        (m) => m.AdminRecyclablesProductsComponent
      ),
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/recycler-verification',
    loadComponent: () =>
      import('./components/admin-recycler-verification/admin-recycler-verification.component').then(
        (m) => m.AdminRecyclerVerificationComponent
      ),
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  // Recycler routes
  {
    path: 'recycler',
    loadChildren: () => import('../valorisation-organique-economie-circulaire/valorisation-organique-economie-circulaire.module')
      .then(m => m.ValorisationOrganiqueEconomieCirculaireModule),
    canActivate: [AuthGuard],
    data: { roles: ['RECYCLER', 'ADMIN', 'DONOR'] }
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionUserRoutingModule { }