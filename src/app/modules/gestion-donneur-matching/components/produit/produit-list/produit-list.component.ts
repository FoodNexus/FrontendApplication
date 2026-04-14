import { Component, OnInit } from '@angular/core';
import { ProduitService } from '../../../services/produit.service';
import { ProduitResponse } from '../../../models/produit.model';
import { CategorieProduit } from '../../../models/enums.model';

@Component({
  selector: 'app-produit-list',
  templateUrl: './produit-list.component.html',
  styleUrls: ['./produit-list.component.scss']
})
export class ProduitListComponent implements OnInit {

  produits: ProduitResponse[] = [];
  searchKeyword = '';
  selectedCategorie = '';
  categories = Object.values(CategorieProduit);
  successMessage = '';

  constructor(private produitService: ProduitService) {}

  ngOnInit(): void {
    this.loadProduits();
  }

  loadProduits(): void {
    this.produitService.getAll().subscribe(data => this.produits = data);
  }

  rechercher(): void {
    if (this.searchKeyword.trim()) {
      this.produitService.rechercher(this.searchKeyword)
        .subscribe(data => this.produits = data);
    } else {
      this.loadProduits();
    }
  }

  filtrerParCategorie(): void {
    if (this.selectedCategorie) {
      this.produitService.getByCategorie(this.selectedCategorie as CategorieProduit)
        .subscribe(data => this.produits = data);
    } else {
      this.loadProduits();
    }
  }

  supprimer(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      this.produitService.delete(id).subscribe(() => {
        this.successMessage = 'Produit supprimé avec succès';
        this.loadProduits();
        setTimeout(() => this.successMessage = '', 3000);
      });
    }
  }

  getCategorieClass(categorie: string): string {
    switch (categorie) {
      case 'FRAIS':   return 'cat-frais';
      case 'SURGELE': return 'cat-surgele';
      case 'SEC':     return 'cat-sec';
      default:        return 'cat-default';
    }
  }

  reinitialiser(): void {
    this.searchKeyword = '';
    this.selectedCategorie = '';
    this.loadProduits();
  }
}