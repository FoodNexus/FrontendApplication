import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProduitService } from '../../../services/produit.service';
import { ProduitRequest } from '../../../models/produit.model';
import { CategorieProduit } from '../../../models/enums.model';

@Component({
  selector: 'app-produit-form',
  templateUrl: './produit-form.component.html'
})
export class ProduitFormComponent implements OnInit {

  produit: ProduitRequest = {
    codeBarre: '',
    libelle: '',
    categorie: CategorieProduit.FRAIS,
    poidsUnitaire: 0
  };

  categories = Object.values(CategorieProduit);
  isEditMode = false;
  produitId: number | null = null;
  errorMessage = '';

  constructor(
    private produitService: ProduitService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.produitId = +id;
      this.produitService.getById(this.produitId).subscribe({
        next: (data) => {
          this.produit = {
            codeBarre: data.codeBarre,
            libelle: data.libelle,
            categorie: data.categorie,
            poidsUnitaire: data.poidsUnitaire
          };
        },
        error: () => this.errorMessage = 'Produit non trouvé'
      });
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    if (this.isEditMode && this.produitId) {
      this.produitService.update(this.produitId, this.produit).subscribe({
        next: () => this.router.navigate(['donneur/produits']),
        error: (err) => this.errorMessage = err.error?.message || 'Erreur lors de la modification'
      });
    } else {
      this.produitService.create(this.produit).subscribe({
        next: () => this.router.navigate(['donneur/produits']),
        error: (err) => this.errorMessage = err.error?.message || 'Erreur lors de la création'
      });
    }
  }
}