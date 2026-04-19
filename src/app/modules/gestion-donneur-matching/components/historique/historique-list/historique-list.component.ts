import { Component, OnInit } from '@angular/core';
import { HistoriqueService } from '../../../services/historique.service';
import { HistoriqueResponse } from '../../../models/historique.model';

@Component({
  selector: 'app-historique-list',
  templateUrl: './historique-list.component.html'
})
export class HistoriqueListComponent implements OnInit {

  historiques: HistoriqueResponse[] = [];
  peremptionProche: HistoriqueResponse[] = [];
  perimes: HistoriqueResponse[] = [];
  activeTab = 'tous';
  successMessage = '';

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
    switch (this.activeTab) {
      case 'proche': return this.peremptionProche;
      case 'perimes': return this.perimes;
      default: return this.historiques;
    }
  }
}