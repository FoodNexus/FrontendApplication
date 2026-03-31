import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RecyclingProducts } 
  from '../../../models/recycling-products.model';
import { RecyclingProductsService } 
  from '../../../services/recycling-products.service';

@Component({
  selector: 'app-recycling-products-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recycling-products-list.component.html',
  styleUrls: ['./recycling-products-list.component.scss']
})
export class RecyclingProductsListComponent implements OnInit {

  products: RecyclingProducts[] = [];
  loading = false;
  errorMessage = '';

  constructor(private service: RecyclingProductsService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur de chargement';
        this.loading = false;
      }
    });
  }

  delete(id: number): void {
    if (confirm('Voulez-vous supprimer ce produit ?')) {
      this.service.delete(id).subscribe({
        next: () => this.loadAll(),
        error: () => this.errorMessage = 'Erreur de suppression'
      });
    }
  }

  getDestinationClass(destination: string): string {
    switch (destination) {
      case 'COMPOST':     return 'badge bg-success';
      case 'AGRICULTEUR': return 'badge bg-info text-dark';
      default:            return 'badge bg-warning text-dark';
    }
  }
}