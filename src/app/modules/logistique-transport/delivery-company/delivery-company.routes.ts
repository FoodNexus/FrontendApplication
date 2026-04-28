import { Routes } from '@angular/router';
import { GestionVehiculesComponent } from './vehicles/pages/gestion-vehicules/gestion-vehicules.component';
import { GestionTransporteursComponent } from './transporters/pages/gestion-transporteurs/gestion-transporteurs.component';
import { GestionDemandesLivraisonComponent } from './delivery-requests/pages/gestion-demandes-livraison/gestion-demandes-livraison.component';
import { ProfileComponent } from './profile/pages/profile/profile.component';
import { CreateDeliveryRequestComponent } from './delivery-requests/pages/create-delivery-request/create-delivery-request.component';

export const DELIVERY_COMPANY_ROUTES: Routes = [
  { path: 'delivery-requests/create', component: CreateDeliveryRequestComponent },
  { path: 'delivery-requests', component: GestionDemandesLivraisonComponent },
  { path: 'vehicles', component: GestionVehiculesComponent },
  { path: 'transporters', component: GestionTransporteursComponent },
  { path: 'profile', component: ProfileComponent },
];
