import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LotService } from '../../../services/lot.service';
import { HistoriqueService } from '../../../services/historique.service';
import { MatchFractionneService } from '../../../services/match-fractionne.service';
import { LotResponse } from '../../../models/lot.model';
import { HistoriqueResponse } from '../../../models/historique.model';
import { MatchFractionneResponse } from '../../../models/match-fractionne.model';
import { StatutLot } from '../../../models/enums.model';

@Component({
  selector: 'app-lot-detail',
  templateUrl: './lot-detail.component.html'
})
export class LotDetailComponent implements OnInit {

  lot: LotResponse | null = null;
  historiques: HistoriqueResponse[] = [];
  matchs: MatchFractionneResponse[] = [];
  errorMessage = '';

  constructor(
    private lotService: LotService,
    private historiqueService: HistoriqueService,
    private matchService: MatchFractionneService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this.lotService.getById(id).subscribe(data => {
      this.lot = data;
      this.historiqueService.getByLotId(id).subscribe(h => this.historiques = h);
      this.matchService.getByLotId(id).subscribe(m => this.matchs = m);
    });
  }

  changerStatut(statut: string): void {
    if (this.lot) {
      this.lotService.changerStatut(this.lot.idLot, statut as StatutLot).subscribe({
        next: (data) => this.lot = data,
        error: (err) => this.errorMessage = err.error?.message || 'Erreur'
      });
    }
  }

  lancerMatching(): void {
    if (this.lot) {
      this.router.navigate(['donneur/matching/lancer'], { queryParams: { lotId: this.lot.idLot } });
    }
  }

  getStatutBadge(s: string): string {
    switch (s) {
      case 'PREDIT_DISPONIBLE': return 'bg-primary';
      case 'EN_COURS_MATCHING': return 'bg-warning text-dark';
      case 'MATCH_VALIDE': return 'bg-success';
      case 'ORIENTE_RECYCLAGE': return 'bg-secondary';
      default: return 'bg-dark';
    }
  }

  getUrgenceBadge(u: string): string {
    switch (u) {
      case 'CRITIQUE': return 'bg-danger';
      case 'MOYEN': return 'bg-warning text-dark';
      case 'FAIBLE': return 'bg-info';
      default: return 'bg-secondary';
    }
  }
}