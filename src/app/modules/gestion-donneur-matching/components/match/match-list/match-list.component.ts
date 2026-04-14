import { Component, OnInit } from '@angular/core';
import { MatchFractionneService } from '../../../services/match-fractionne.service';
import { MatchFractionneResponse } from '../../../models/match-fractionne.model';
import { StatutMatch } from '../../../models/enums.model';

@Component({
  selector: 'app-match-list',
  templateUrl: './match-list.component.html',
  styleUrls: ['./match-list.component.scss']
})
export class MatchListComponent implements OnInit {

  matchs: MatchFractionneResponse[] = [];
  selectedStatut = '';
  statuts = Object.values(StatutMatch);
  successMessage = '';

  constructor(private matchService: MatchFractionneService) {}

  ngOnInit(): void { this.loadMatchs(); }

  loadMatchs(): void {
    this.matchService.getAll().subscribe(data => this.matchs = data);
  }

  filtrerParStatut(): void {
    if (this.selectedStatut) {
      this.matchService.getByStatut(this.selectedStatut as StatutMatch).subscribe(data => this.matchs = data);
    } else { this.loadMatchs(); }
  }

  changerStatut(id: number, statut: string): void {
    this.matchService.changerStatut(id, statut as StatutMatch).subscribe({
      next: () => { this.successMessage = 'Statut modifié'; this.loadMatchs(); setTimeout(() => this.successMessage = '', 3000); },
      error: (err) => alert(err.error?.message || 'Erreur')
    });
  }

  getStatutClass(s: string): string {
    switch (s) {
      case 'EN_ATTENTE_LOGISTIQUE': return 'statut-en-cours';
      case 'CONFIRME': return 'statut-disponible';
      case 'LIVRE': return 'statut-termine';
      case 'REFUSE': return 'statut-refuse';
      case 'ANNULE': return 'statut-annule';
      default: return 'statut-default';
    }
  }
}