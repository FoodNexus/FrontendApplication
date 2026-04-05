import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'audit',
    loadChildren: () => import('./modules/audit-conformite-contrat-numerique/audit-conformite-contrat-numerique.module')
      .then(m => m.AuditConformiteContratNumeriqueModule)
  },
  {
    path: 'user',
    loadChildren: () => import('./modules/gestion-user/gestion-user.module')
      .then(m => m.GestionUserModule)
  },
  { path: '', redirectTo: 'user/home', pathMatch: 'full' }
];