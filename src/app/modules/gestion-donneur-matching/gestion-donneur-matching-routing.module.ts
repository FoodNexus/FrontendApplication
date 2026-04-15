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
import { AiDashboardComponent } from './components/ai/ai-dashboard/ai-dashboard.component';
import { OcrScanComponent } from './components/ai/ocr-scan/ocr-scan.component';
import { NlpAnalyseComponent } from './components/ai/nlp-analyse/nlp-analyse.component';
import { QualityCheckComponent } from './components/ai/quality-check/quality-check.component';
import { LearningDashboardComponent } from './components/ai/learning-dashboard/learning-dashboard.component';

const routes: Routes = [
  // ✅ dashboard donneur
  { path: 'dashboard', component: DashboardDonneurComponent },
  
  // ✅ produits
  { path: 'produits', component: ProduitListComponent },
  { path: 'produits/nouveau', component: ProduitFormComponent },
  { path: 'produits/modifier/:id', component: ProduitFormComponent },
  { path: 'produits/:id', component: ProduitDetailComponent },
  
  // ✅ lots
  { path: 'lots', component: LotListComponent },
  { path: 'lots/nouveau', component: LotFormComponent },
  { path: 'lots/modifier/:id', component: LotFormComponent },
  { path: 'lots/:id', component: LotDetailComponent },
  
  // ✅ historiques
  { path: 'historiques', component: HistoriqueListComponent },
  { path: 'historiques/nouveau', component: HistoriqueFormComponent },
  { path: 'historiques/modifier/:id', component: HistoriqueFormComponent },
  
  // ✅ matchs
  { path: 'matchs', component: MatchListComponent },
  { path: 'matchs/:id', component: MatchDetailComponent },
  
  // ✅ matching
  { path: 'matching', component: MatchingLancerComponent },
  { path: 'matching/resultat', component: MatchingResultatComponent },

  // ✅ IA
  { path: 'ai', component: AiDashboardComponent },
  { path: 'ai/ocr', component: OcrScanComponent },
  { path: 'ai/nlp', component: NlpAnalyseComponent },
  { path: 'ai/quality', component: QualityCheckComponent },
  { path: 'ai/learning', component: LearningDashboardComponent },

  // ✅ redirect par défaut
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionDonneurMatchingRoutingModule { }