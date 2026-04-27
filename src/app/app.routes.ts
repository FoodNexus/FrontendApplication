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
  {
    path: 'donneur',
    loadChildren: () => import('./modules/gestion-donneur-matching/gestion-donneur-matching.module')
      .then(m => m.GestionDonneurMatchingModule)
  },
  {
    path: 'receveur',
    loadChildren: () => import('./modules/gestion-receveur/gestion-receveur.module')
      .then(m => m.GestionReceveurModule)
  },
  { path: '', redirectTo: 'receveur/dashboard', pathMatch: 'full' }
];