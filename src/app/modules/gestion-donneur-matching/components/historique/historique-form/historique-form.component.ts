import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HistoriqueService } from '../../../services/historique.service';
import { ProduitService } from '../../../services/produit.service';
import { LotService } from '../../../services/lot.service';
import { HistoriqueRequest } from '../../../models/historique.model';
import { ProduitResponse } from '../../../models/produit.model';
import { LotResponse } from '../../../models/lot.model';

@Component({
  selector: 'app-historique-form',
  templateUrl: './historique-form.component.html'
})
export class HistoriqueFormComponent implements OnInit {

  historique: HistoriqueRequest = { lotId: 0, produitId: 0, quantite: 0, datePeremptionExacte: '' };
  lots: LotResponse[] = [];
  produits: ProduitResponse[] = [];
  isEditMode = false;
  historiqueId: number | null = null;
  errorMessage = '';

  constructor(
    private historiqueService: HistoriqueService,
    private lotService: LotService,
    private produitService: ProduitService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.lotService.getAll().subscribe(data => this.lots = data);
    this.produitService.getAll().subscribe(data => this.produits = data);

    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.historiqueId = +id;
      this.historiqueService.getById(this.historiqueId).subscribe({
        next: (data) => {
          this.historique = { lotId: data.lotId, produitId: data.produitId, quantite: data.quantite, datePeremptionExacte: data.datePeremptionExacte };
        },
        error: () => this.errorMessage = 'Non trouvé'
      });
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    if (this.isEditMode && this.historiqueId) {
      this.historiqueService.update(this.historiqueId, this.historique).subscribe({
        next: () => this.router.navigate(['donneur/historiques']),
        error: (err) => this.errorMessage = err.error?.message || 'Erreur'
      });
    } else {
      this.historiqueService.create(this.historique).subscribe({
        next: () => this.router.navigate(['donneur/historiques']),
        error: (err) => this.errorMessage = err.error?.message || 'Erreur'
      });
    }
  }
}