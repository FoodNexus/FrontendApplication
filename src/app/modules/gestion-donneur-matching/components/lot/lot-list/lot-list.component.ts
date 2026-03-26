import { Component, OnInit } from '@angular/core';
import { LotService } from '../../../services/lot.service';
import { LotResponse } from '../../../models/lot.model';
import { StatutLot, NiveauUrgence } from '../../../models/enums.model';

@Component({
  selector: 'app-lot-list',
  templateUrl: './lot-list.component.html'
})
export class LotListComponent implements OnInit {

  lots: LotResponse[] = [];
  selectedStatut = '';
  selectedUrgence = '';
  statuts = Object.values(StatutLot);
  urgences = Object.values(NiveauUrgence);
  successMessage = '';

  constructor(private lotService: LotService) {}

  ngOnInit(): void { this.loadLots(); }

  loadLots(): void {
    this.lotService.getAll().subscribe(data => this.lots = data);
  }

  filtrerParStatut(): void {
    if (this.selectedStatut) {
      this.lotService.getByStatut(this.selectedStatut as StatutLot)
        .subscribe(data => this.lots = data);
    } else { this.loadLots(); }
  }

  filtrerParUrgence(): void {
    if (this.selectedUrgence) {
      this.lotService.getByUrgence(this.selectedUrgence as NiveauUrgence)
        .subscribe(data => this.lots = data);
    } else { this.loadLots(); }
  }

  supprimer(id: number): void {
    if (confirm('Supprimer ce lot ?')) {
      this.lotService.delete(id).subscribe({
        next: () => { this.successMessage = 'Lot supprimé'; this.loadLots(); setTimeout(() => this.successMessage = '', 3000); },
        error: (err) => alert(err.error?.message || 'Erreur')
      });
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

  reinitialiser(): void {
    this.selectedStatut = '';
    this.selectedUrgence = '';
    this.loadLots();
  }
}