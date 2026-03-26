import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'donneur',
    loadChildren: () =>
      import('./modules/gestion-donneur-matching/gestion-donneur-matching.module')
        .then(m => m.GestionDonneurMatchingModule)
  },
  // tes autres modules...
  { path: '', redirectTo: 'donneur', pathMatch: 'full' },
  { path: '**', redirectTo: 'donneur' }
];