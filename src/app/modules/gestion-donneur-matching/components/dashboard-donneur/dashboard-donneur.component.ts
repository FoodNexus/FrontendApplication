import { Component, OnInit } from '@angular/core';
import { ProduitService } from '../../services/produit.service';
import { LotService } from '../../services/lot.service';
import { MatchFractionneService } from '../../services/match-fractionne.service';
import { HistoriqueService } from '../../services/historique.service';
import { ProduitResponse } from '../../models/produit.model';
import { LotResponse } from '../../models/lot.model';
import { MatchFractionneResponse } from '../../models/match-fractionne.model';
import { HistoriqueResponse } from '../../models/historique.model';
import { ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-dashboard-donneur',
  templateUrl: './dashboard-donneur.component.html',
  styleUrls: ['./dashboard-donneur.component.scss'],
  encapsulation: ViewEncapsulation.None  
})
export class DashboardDonneurComponent implements OnInit {

  produits: ProduitResponse[] = [];
  lots: LotResponse[] = [];
  matchs: MatchFractionneResponse[] = [];
  alertes: HistoriqueResponse[] = [];

  constructor(
    private produitService: ProduitService,
    private lotService: LotService,
    private matchService: MatchFractionneService,
    private historiqueService: HistoriqueService
  ) {}

  ngOnInit(): void {
    this.produitService.getAll().subscribe(data => this.produits = data);
    this.lotService.getAll().subscribe(data => this.lots = data);
    this.matchService.getAll().subscribe(data => this.matchs = data);
    this.historiqueService.getPeremptionProche().subscribe(data => this.alertes = data);
  }

  get lotsCritiques(): LotResponse[] {
    return this.lots.filter(l => l.niveauUrgence === 'CRITIQUE' && l.statut === 'PREDIT_DISPONIBLE');
  }

  get matchsEnAttente(): MatchFractionneResponse[] {
    return this.matchs.filter(m => m.statutMatch === 'EN_ATTENTE_LOGISTIQUE');
  }

  get lotsDisponibles(): LotResponse[] {
    return this.lots.filter(l => l.statut === 'PREDIT_DISPONIBLE');
  }

  get lotsValides(): LotResponse[] {
    return this.lots.filter(l => l.statut === 'MATCH_VALIDE');
  }
}