import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './modules/valorisation-organique-economie-circulaire/dashboard-layout.component';
import { ModuleWorkspaceComponent } from './modules/valorisation-organique-economie-circulaire/module-workspace.component';
import { RecyclablesCrudComponent } from './modules/valorisation-organique-economie-circulaire/recyclables-crud.component';
import { RecyclerFrontLayoutComponent } from './modules/valorisation-organique-economie-circulaire/recycler-front-layout.component';
import { StoreRecycleRequestsComponent } from './modules/valorisation-organique-economie-circulaire/store-recycle-requests.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'audit-conformite' },
      {
        path: 'audit-conformite',
        component: ModuleWorkspaceComponent,
        data: {
          title: 'Audit Conformite',
          description: 'Espace de travail pour le suivi des audits et des conformites.'
        }
      },
      {
        path: 'gestion-donneur-matching',
        component: ModuleWorkspaceComponent,
        data: {
          title: 'Gestion Donneur + Matching',
          description: 'Espace pour la coordination des donneurs et les regles de matching.'
        }
      },
      {
        path: 'communaut-impact-societal',
        component: ModuleWorkspaceComponent,
        data: {
          title: 'Communaut - Impact Societal',
          description: 'Espace dedie aux initiatives communautaires et a leur impact social.'
        }
      },
      {
        path: 'valorisation-organique-economie-circulaire',
        component: ModuleWorkspaceComponent,
        data: {
          title: 'Valorisation Organique + Economie Circulaire',
          description: 'Espace pour les flux organiques et la strategie d economie circulaire.'
        }
      },
      {
        path: 'logistique-transport',
        component: ModuleWorkspaceComponent,
        data: {
          title: 'Logistique Transport',
          description: 'Espace de coordination des operations logistiques et du transport.'
        }
      },
      {
        path: 'gestion-receveur',
        component: ModuleWorkspaceComponent,
        data: {
          title: 'Gestion Receveur',
          description: 'Espace receveur. Accedez a votre CRUD recyclables via la route dediee.'
        }
      },
      {
        path: 'gestion-receveur/recyclables',
        component: RecyclablesCrudComponent
      }
    ]
  },
  {
    path: 'recycler-front',
    component: RecyclerFrontLayoutComponent
  },
  {
    path: 'store-recycle-requests',
    component: StoreRecycleRequestsComponent
  },
  {
    path: 'gestion-receveur/recycler-front',
    redirectTo: 'recycler-front',
    pathMatch: 'full'
  },
  {
    path: 'gestion-receveur/store-recycle-requests',
    redirectTo: 'store-recycle-requests',
    pathMatch: 'full'
  },
  { path: '**', redirectTo: '' }
];
