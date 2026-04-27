import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../gestion-user/guards/auth.guard';

const routes: Routes = [

  // InspectionCase
  {
    path: 'inspection-cases',
    canActivate: [AuthGuard],
    data: { roles: ['AUDITOR'] },
    loadComponent: () => import('./components/inspection-case/inspection-case-list/inspection-case-list.component')
      .then(m => m.InspectionCaseListComponent)
  },
  {
    path: 'inspection-cases/add',
    canActivate: [AuthGuard],
    data: { roles: ['AUDITOR'] },
    loadComponent: () => import('./components/inspection-case/inspection-case-form/inspection-case-form.component')
      .then(m => m.InspectionCaseFormComponent)
  },
  {
    path: 'inspection-cases/edit/:id',
    canActivate: [AuthGuard],
    data: { roles: ['AUDITOR'] },
    loadComponent: () => import('./components/inspection-case/inspection-case-form/inspection-case-form.component')
      .then(m => m.InspectionCaseFormComponent)
  },

  // RecyclingProducts
  {
    path: 'recycling-products',
    canActivate: [AuthGuard],
    data: { roles: ['AUDITOR'] },
    loadComponent: () => import('./components/recycling-products/recycling-products-list/recycling-products-list.component')
      .then(m => m.RecyclingProductsListComponent)
  },
  {
    path: 'recycling-products/add',
    canActivate: [AuthGuard],
    data: { roles: ['AUDITOR'] },
    loadComponent: () => import('./components/recycling-products/recycling-products-form/recycling-products-form.component')
      .then(m => m.RecyclingProductsFormComponent)
  },
  {
    path: 'recycling-products/edit/:id',
    canActivate: [AuthGuard],
    data: { roles: ['AUDITOR'] },
    loadComponent: () => import('./components/recycling-products/recycling-products-form/recycling-products-form.component')
      .then(m => m.RecyclingProductsFormComponent)
  },

  // DigitalContract (Usually restricted to ADMIN or specific roles, let's use ADMIN as requested in previous sessions, or both)
  {
    path: 'contracts',
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./components/digital-contract/digital-contract-list/digital-contract-list.component')
      .then(m => m.DigitalContractListComponent)
  },
  {
    path: 'contracts/add',
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./components/digital-contract/digital-contract-form/digital-contract-form.component')
      .then(m => m.DigitalContractFormComponent)
  },
  {
    path: 'contracts/edit/:id',
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./components/digital-contract/digital-contract-form/digital-contract-form.component')
      .then(m => m.DigitalContractFormComponent)
  },
  {
    path: 'contracts/print/:id',
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./components/digital-contract/digital-contract-pdf/digital-contract-pdf.component')
      .then(m => m.DigitalContractPdfComponent)
  },

  {
    path: 'nutriflow-dossier-summary',
    canActivate: [AuthGuard],
    data: { roles: ['AUDITOR', 'ADMIN'] },
    loadComponent: () =>
      import('./components/nutriflow-dossier-summary/nutriflow-dossier-summary.component').then(
        (m) => m.NutriflowDossierSummaryComponent
      )
  },

  // Default
  { path: '', redirectTo: 'inspection-cases', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuditConformiteContratNumeriqueRoutingModule { }