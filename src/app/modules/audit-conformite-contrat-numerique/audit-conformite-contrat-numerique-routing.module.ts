import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [

  // InspectionCase
  {
    path: 'inspection-cases',
    loadComponent: () => import('./components/inspection-case/inspection-case-list/inspection-case-list.component')
      .then(m => m.InspectionCaseListComponent)
  },
  {
    path: 'inspection-cases/add',
    loadComponent: () => import('./components/inspection-case/inspection-case-form/inspection-case-form.component')
      .then(m => m.InspectionCaseFormComponent)
  },
  {
    path: 'inspection-cases/edit/:id',
    loadComponent: () => import('./components/inspection-case/inspection-case-form/inspection-case-form.component')
      .then(m => m.InspectionCaseFormComponent)
  },

  // RecyclingProducts
  {
    path: 'recycling-products',
    loadComponent: () => import('./components/recycling-products/recycling-products-list/recycling-products-list.component')
      .then(m => m.RecyclingProductsListComponent)
  },
  {
    path: 'recycling-products/add',
    loadComponent: () => import('./components/recycling-products/recycling-products-form/recycling-products-form.component')
      .then(m => m.RecyclingProductsFormComponent)
  },
  {
    path: 'recycling-products/edit/:id',
    loadComponent: () => import('./components/recycling-products/recycling-products-form/recycling-products-form.component')
      .then(m => m.RecyclingProductsFormComponent)
  },

  // DigitalContract
  {
    path: 'contracts',
    loadComponent: () => import('./components/digital-contract/digital-contract-list/digital-contract-list.component')
      .then(m => m.DigitalContractListComponent)
  },
  {
    path: 'contracts/add',
    loadComponent: () => import('./components/digital-contract/digital-contract-form/digital-contract-form.component')
      .then(m => m.DigitalContractFormComponent)
  },

  // Default
  { path: '', redirectTo: 'inspection-cases', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuditConformiteContratNumeriqueRoutingModule { }