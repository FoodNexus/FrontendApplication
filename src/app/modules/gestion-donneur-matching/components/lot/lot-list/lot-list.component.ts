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
  searchKeyword = '';
  selectedStatut = '';
  selectedUrgence = '';
  statuts = Object.values(StatutLot);
  urgences = Object.values(NiveauUrgence);
  successMessage = '';
  Math = Math;

  // Pagination
  currentPage = 1;
  pageSize = 10;

  get totalPages(): number {
    return Math.ceil(this.lots.length / this.pageSize);
  }

  get paginatedLots(): LotResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.lots.slice(start, start + this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  constructor(private lotService: LotService) {}

  ngOnInit(): void { this.loadLots(); }

  loadLots(): void {
    this.lotService.getAll().subscribe(data => {
      this.lots = data;
      this.currentPage = 1;
    });
  }

  rechercher(): void {
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase();
      // On filtre côté client pour l'instant pour plus de réactivité
      this.lotService.getAll().subscribe(data => {
        this.lots = data.filter(l => 
          l.idLot.toString().includes(keyword) || 
          l.donneurId.toString().includes(keyword)
        );
        this.currentPage = 1;
      });
    } else {
      this.loadLots();
    }
  }

  filtrerParStatut(): void {
    if (this.selectedStatut) {
      this.lotService.getByStatut(this.selectedStatut as StatutLot)
        .subscribe(data => {
          this.lots = data;
          this.currentPage = 1;
        });
    } else { this.loadLots(); }
  }

  filtrerParUrgence(): void {
    if (this.selectedUrgence) {
      this.lotService.getByUrgence(this.selectedUrgence as NiveauUrgence)
        .subscribe(data => {
          this.lots = data;
          this.currentPage = 1;
        });
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
    case 'EN_COURS_MATCHING': return 'statut-en-cours';
    case 'MATCH_VALIDE':      return 'statut-termine';
    case 'ORIENTE_RECYCLAGE': return 'statut-recycle';
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
    this.searchKeyword = '';
    this.selectedStatut = '';
    this.selectedUrgence = '';
    this.loadLots();
  }
}