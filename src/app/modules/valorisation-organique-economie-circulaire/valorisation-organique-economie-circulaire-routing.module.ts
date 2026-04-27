import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ValorisationDashboardLayoutComponent } from './components/valorisation-dashboard-layout.component';
import { ValorisationWorkspaceComponent } from './components/valorisation-workspace.component';
import { RecyclablesCrudComponent } from './components/recyclables-crud.component';
import { StoreRecycleRequestsComponent } from './components/store-recycle-requests.component';
import { NutriFlowRecyclerShellComponent } from './components/nutriflow-recycler-shell.component';
import { DonorValorisationShellComponent } from './components/donor-valorisation-shell.component';
import { DonorValorisationWorkspaceComponent } from './components/donor-valorisation-workspace.component';
import { NutriFlowImageClassifyComponent } from './components/nutriflow-image-classify.component';
import { RecyclerRequestsComponent } from './components/recycler-requests.component';
import { NutriFlowRecyclerHomeComponent } from './components/nutriflow-recycler-home.component';
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
            'Espace pour les flux organiques, le recyclage et la coordination avec les receveurs. Les écrans front office et validation store sont accessibles depuis le menu ou les liens ci-dessous.'
        }
      },
      { path: 'recyclables', component: RecyclablesCrudComponent }
    ]
  },
  {
    path: 'nutriflow',
    component: NutriFlowRecyclerShellComponent,
    children: [
      { path: '', component: NutriFlowRecyclerHomeComponent },
      { path: 'requests', component: RecyclerRequestsComponent },
      { path: 'dashboard', redirectTo: '', pathMatch: 'full' }
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
  { path: 'recycler-front', redirectTo: 'nutriflow', pathMatch: 'full' },
  { path: 'store-requests', component: StoreRecycleRequestsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ValorisationOrganiqueEconomieCirculaireRoutingModule {}
