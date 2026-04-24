import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ValorisationDashboardLayoutComponent } from './components/valorisation-dashboard-layout.component';
import { ValorisationWorkspaceComponent } from './components/valorisation-workspace.component';
import { RecyclablesCrudComponent } from './components/recyclables-crud.component';
import { RecyclerFrontLayoutComponent } from './components/recycler-front-layout.component';
import { StoreRecycleRequestsComponent } from './components/store-recycle-requests.component';

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
  { path: 'recycler-front', component: RecyclerFrontLayoutComponent },
  { path: 'store-requests', component: StoreRecycleRequestsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ValorisationOrganiqueEconomieCirculaireRoutingModule {}
