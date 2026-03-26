import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardDonneurComponent } from './components/dashboard-donneur/dashboard-donneur.component';
import { ProduitListComponent } from './components/produit/produit-list/produit-list.component';
import { ProduitFormComponent } from './components/produit/produit-form/produit-form.component';
import { ProduitDetailComponent } from './components/produit/produit-detail/produit-detail.component';
import { LotListComponent } from './components/lot/lot-list/lot-list.component';
import { LotFormComponent } from './components/lot/lot-form/lot-form.component';
import { LotDetailComponent } from './components/lot/lot-detail/lot-detail.component';
import { HistoriqueListComponent } from './components/historique/historique-list/historique-list.component';
import { HistoriqueFormComponent } from './components/historique/historique-form/historique-form.component';
import { MatchListComponent } from './components/match/match-list/match-list.component';
import { MatchDetailComponent } from './components/match/match-detail/match-detail.component';
import { MatchingLancerComponent } from './components/matching/matching-lancer/matching-lancer.component';
import { MatchingResultatComponent } from './components/matching/matching-resultat/matching-resultat.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardDonneurComponent },

  { path: 'produits', component: ProduitListComponent },
  { path: 'produits/ajouter', component: ProduitFormComponent },
  { path: 'produits/modifier/:id', component: ProduitFormComponent },
  { path: 'produits/:id', component: ProduitDetailComponent },

  { path: 'lots', component: LotListComponent },
  { path: 'lots/ajouter', component: LotFormComponent },
  { path: 'lots/modifier/:id', component: LotFormComponent },
  { path: 'lots/:id', component: LotDetailComponent },

  { path: 'historiques', component: HistoriqueListComponent },
  { path: 'historiques/ajouter', component: HistoriqueFormComponent },
  { path: 'historiques/modifier/:id', component: HistoriqueFormComponent },

  { path: 'matchs', component: MatchListComponent },
  { path: 'matchs/:id', component: MatchDetailComponent },

  { path: 'matching/lancer', component: MatchingLancerComponent },
  { path: 'matching/resultat/:lotId', component: MatchingResultatComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionDonneurMatchingRoutingModule {}