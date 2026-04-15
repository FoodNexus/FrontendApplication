import { Component, OnInit } from '@angular/core';
import { HistoriqueService } from '../../../services/historique.service';
import { HistoriqueResponse } from '../../../models/historique.model';

@Component({
  selector: 'app-historique-list',
  templateUrl: './historique-list.component.html',
  styleUrls: ['./historique-list.component.scss']
})
export class HistoriqueListComponent implements OnInit {

  historiques: HistoriqueResponse[] = [];
  peremptionProche: HistoriqueResponse[] = [];
  perimes: HistoriqueResponse[] = [];
  activeTab = 'tous';
  searchKeyword = '';
  successMessage = '';
  Math = Math;

  // Pagination
  currentPage = 1;
  pageSize = 10;

  get totalPages(): number {
    return Math.ceil(this.displayedList.length / this.pageSize);
  }

  get paginatedHistoriques(): HistoriqueResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.displayedList.slice(start, start + this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  constructor(private historiqueService: HistoriqueService) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.historiqueService.getAll().subscribe(data => this.historiques = data);
    this.historiqueService.getPeremptionProche().subscribe(data => this.peremptionProche = data);
    this.historiqueService.getPerimes().subscribe(data => this.perimes = data);
  }

  supprimer(id: number): void {
    if (confirm('Supprimer ?')) {
      this.historiqueService.delete(id).subscribe(() => {
        this.successMessage = 'Supprimé';
        this.loadAll();
        setTimeout(() => this.successMessage = '', 3000);
      });
    }
  }

  get displayedList(): HistoriqueResponse[] {
    let list: HistoriqueResponse[] = [];
    switch (this.activeTab) {
      case 'proche': list = this.peremptionProche; break;
      case 'perimes': list = this.perimes; break;
      default: list = this.historiques; break;
    }

    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase();
      return list.filter(h => 
        h.libelleProduit.toLowerCase().includes(keyword) || 
        h.codeBarre.toLowerCase().includes(keyword) ||
        h.idHistorique.toString().includes(keyword)
      );
    }
    return list;
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.currentPage = 1;
  }
}