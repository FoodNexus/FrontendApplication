import { Component, OnInit } from '@angular/core';
import { LotService } from '../../../services/lot.service';
import { LotResponse } from '../../../models/lot.model';
import { StatutLot, NiveauUrgence } from '../../../models/enums.model';
import { ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-lot-list',
  templateUrl: './lot-list.component.html',
  styleUrls: ['./lot-list.component.scss'],
  encapsulation: ViewEncapsulation.None  
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

  getStatutClass(statut: string): string {
  switch (statut) {
    case 'PREDIT_DISPONIBLE': return 'statut-disponible';
    case 'EN_COURS':          return 'statut-en-cours';
    case 'TERMINE':           return 'statut-termine';
    default:                  return 'statut-default';
  }
}

  getUrgenceClass(urgence: string): string {
  switch (urgence) {
    case 'CRITIQUE': return 'urgence-critique';
    case 'HAUTE':    return 'urgence-haute';
    case 'NORMALE':  return 'urgence-normale';
    case 'BASSE':    return 'urgence-basse';
    default:         return 'urgence-normale';
  }
}

  reinitialiser(): void {
    this.selectedStatut = '';
    this.selectedUrgence = '';
    this.loadLots();
  }
}