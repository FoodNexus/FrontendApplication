import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardReceveurComponent } from './components/dashboard-receveur/dashboard-receveur.component';
import { StockageListComponent } from './components/stockage/stockage-list/stockage-list.component';
import { StockageFormComponent } from './components/stockage/stockage-form/stockage-form.component';
import { StockageDetailComponent } from './components/stockage/stockage-detail/stockage-detail.component';
import { BesoinListComponent } from './components/besoin/besoin-list/besoin-list.component';
import { BesoinFormComponent } from './components/besoin/besoin-form/besoin-form.component';
import { BesoinDetailComponent } from './components/besoin/besoin-detail/besoin-detail.component';
import { NotationListComponent } from './components/notation/notation-list/notation-list.component';
import { NotationFormComponent } from './components/notation/notation-form/notation-form.component';
import { AlertesPageComponent } from './components/alertes-page/alertes-page.component';
import { IaRecommendationComponent } from './components/ia-recommendation/ia-recommendation.component';

const routes: Routes = [
  { path: 'alertes', component: AlertesPageComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardReceveurComponent },

  // Stockage
  { path: 'stockage', component: StockageListComponent },
  { path: 'stockage/ajout', component: StockageFormComponent },
  { path: 'stockage/modifier', component: StockageDetailComponent },

  // Besoins
  { path: 'besoins', component: BesoinListComponent },
  { path: 'besoins/add', component: BesoinFormComponent },
  { path: 'besoins/edit/:id', component: BesoinFormComponent },
  { path: 'besoins/detail/:id', component: BesoinDetailComponent },

  // Notations
  { path: 'notations', component: NotationListComponent },
  { path: 'notations/add/:donId', component: NotationFormComponent },
  { path: 'historique', component: NotationListComponent },

  // Prédictions
  { path: 'predictions', component: IaRecommendationComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionReceveurRoutingModule { }