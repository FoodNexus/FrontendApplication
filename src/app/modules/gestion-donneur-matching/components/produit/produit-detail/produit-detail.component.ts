import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProduitService } from '../../../services/produit.service';
import { ProduitResponse } from '../../../models/produit.model';

@Component({
  selector: 'app-produit-detail',
  templateUrl: './produit-detail.component.html',
  styleUrls: ['./produit-detail.component.scss']
})
export class ProduitDetailComponent implements OnInit {

  produit: ProduitResponse | null = null;

  constructor(
    private produitService: ProduitService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this.produitService.getById(id).subscribe(data => this.produit = data);
  }

  getCategorieClass(categorie: string): string {
    switch (categorie) {
      case 'FRAIS':   return 'cat-frais';
      case 'SURGELE': return 'cat-surgele';
      case 'SEC':     return 'cat-sec';
      default:        return 'cat-default';
    }
  }
}