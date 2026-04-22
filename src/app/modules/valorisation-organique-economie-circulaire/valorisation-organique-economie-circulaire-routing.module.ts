import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RecyclerRequestsComponent } from './recycler-requests.component';
import { NutriFlowRecyclerShellComponent } from './nutriflow-recycler-shell.component';
import { DonorValorisationShellComponent } from './donor-valorisation-shell.component';
import { DonorValorisationWorkspaceComponent } from './donor-valorisation-workspace.component';

const routes: Routes = [
  {
    path: '',
    component: NutriFlowRecyclerShellComponent,
    children: [
      { path: '', component: RecyclerRequestsComponent },
      { path: 'requests', component: RecyclerRequestsComponent },
      { path: 'dashboard', redirectTo: '', pathMatch: 'full' }
    ]
  },
  {
    path: 'donor',
    component: DonorValorisationShellComponent,
    children: [{ path: '', component: DonorValorisationWorkspaceComponent }]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ValorisationOrganiqueEconomieCirculaireRoutingModule { }
