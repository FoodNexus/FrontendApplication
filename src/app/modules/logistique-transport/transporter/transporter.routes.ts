import { Routes } from '@angular/router';
import { MesLivraisonsComponent } from './mes-livraisons/mes-livraisons.component';
import { CalendrierComponent } from './calendrier/calendrier.component';

export const TRANSPORTER_ROUTES: Routes = [
  { path: 'mes-livraisons', component: MesLivraisonsComponent },
  { path: 'calendrier', component: CalendrierComponent },
  { path: '', pathMatch: 'full', redirectTo: 'mes-livraisons' }
];
