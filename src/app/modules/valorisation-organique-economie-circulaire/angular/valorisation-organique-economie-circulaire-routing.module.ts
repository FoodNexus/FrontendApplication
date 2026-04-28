import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ValorisationDashboardLayoutComponent } from './components/valorisation-dashboard-layout/valorisation-dashboard-layout.component';
import { ValorisationWorkspaceComponent } from './components/valorisation-workspace/valorisation-workspace.component';
import { NutriFlowRecyclerShellComponent } from './components/nutriflow-recycler-shell/nutriflow-recycler-shell.component';
import { DonorValorisationShellComponent } from './components/donor-valorisation-shell/donor-valorisation-shell.component';
import { DonorValorisationWorkspaceComponent } from './components/donor-valorisation-workspace/donor-valorisation-workspace.component';
import { NutriFlowImageClassifyComponent } from './components/nutriflow-image-classify/nutriflow-image-classify.component';
import { RecyclerRequestsComponent } from './components/recycler-requests/recycler-requests.component';
const routes: Routes = [
  {
    path: '',
    component: ValorisationDashboardLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'workspace' },
      {
        path: 'workspace',
        component: ValorisationWorkspaceComponent,
        data: {
          title: 'Valorisation organique + économie circulaire',
          description:
            'Espace pour les flux organiques, le recyclage et la coordination avec les receveurs. Accès NutriFlow recycleur et donateur ci-dessous.'
        }
      },
      { path: 'recyclables', pathMatch: 'full', redirectTo: 'workspace' },
      { path: 'store-requests', pathMatch: 'full', redirectTo: 'workspace' }
    ]
  },
  {
    path: 'nutriflow',
    component: NutriFlowRecyclerShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'requests' },
      { path: 'requests', component: RecyclerRequestsComponent },
      { path: 'dashboard', redirectTo: 'requests', pathMatch: 'full' }
    ]
  },
  {
    path: 'nutriflow-donor',
    component: DonorValorisationShellComponent,
    children: [
      { path: '', component: DonorValorisationWorkspaceComponent },
      { path: 'classify-photo', component: NutriFlowImageClassifyComponent }
    ]
  },
  { path: 'recycler-front', redirectTo: 'nutriflow', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ValorisationOrganiqueEconomieCirculaireRoutingModule {}
