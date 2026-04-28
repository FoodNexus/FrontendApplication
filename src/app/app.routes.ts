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
    path: 'receveur',
    loadChildren: () => import('./modules/gestion-receveur/gestion-receveur.module')
      .then(m => m.GestionReceveurModule)
  },
  {
    path: 'valorisation',
    loadChildren: () => import('./modules/valorisation-organique-economie-circulaire/valorisation-organique-economie-circulaire.module')
      .then(m => m.ValorisationOrganiqueEconomieCirculaireModule)
  },
  { path: '', redirectTo: 'user/home', pathMatch: 'full' }
];