import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'delivery-company/vehicles' },
  {
    path: 'delivery-company',
    loadChildren: () => import('./delivery-company/delivery-company.routes').then(m => m.DELIVERY_COMPANY_ROUTES)
  },
  {
    path: 'transporter',
    loadChildren: () => import('./transporter/transporter.routes').then(m => m.TRANSPORTER_ROUTES)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LogistiqueTransportRoutingModule { }
