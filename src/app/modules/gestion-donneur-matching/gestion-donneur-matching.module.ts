import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { GestionDonneurMatchingRoutingModule } from './gestion-donneur-matching-routing.module';

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

@NgModule({
  declarations: [
    DashboardDonneurComponent,
    ProduitListComponent,
    ProduitFormComponent,
    ProduitDetailComponent,
    LotListComponent,
    LotFormComponent,
    LotDetailComponent,
    HistoriqueListComponent,
    HistoriqueFormComponent,
    MatchListComponent,
    MatchDetailComponent,
    MatchingLancerComponent,
    MatchingResultatComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    GestionDonneurMatchingRoutingModule
  ]
})
export class GestionDonneurMatchingModule {}