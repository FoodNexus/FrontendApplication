import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecyclingProducts, Destination } 
  from '../../../models/recycling-products.model';
import { RecyclingProductsService } 
  from '../../../services/recycling-products.service';
import { AuthService } from '../../../../gestion-user/services/auth.service';
import { NotificationBellComponent } from '../../notification-bell/notification-bell.component';

@Component({
  selector: 'app-recycling-products-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NotificationBellComponent],
  templateUrl: './recycling-products-list.component.html',
  styleUrls: ['./recycling-products-list.component.scss']
})
export class RecyclingProductsListComponent implements OnInit {

  products: RecyclingProducts[] = [];
  filteredProducts: RecyclingProducts[] = [];
  loading = false;
  errorMessage = '';
  searchTerm = '';
  selectedDestination = '';

  // Pagination
  currentPage = 1;
  pageSize = 6;

  destinationOptions = Object.values(Destination);

  constructor(
    private service: RecyclingProductsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.authService.getCurrentUser()) {
       this.authService.fetchUserProfile().subscribe(() => this.loadAll());
    } else {
       this.loadAll();
    }
  }

  loadAll(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        const user = this.authService.getCurrentUser();
        let results = data || [];
        
        if (!this.authService.hasRole('ADMIN')) {
          results = results.filter(p => p.inspectionCase?.auditorId === user?.idUser);
        }
        
        this.products = results.sort((a, b) => b.logId! - a.logId!);
        this.filter();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur de chargement';
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.filter();
  }

  filter(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(p => {
      const matchSearch = p.inspectionCase?.description?.toLowerCase().includes(term) ||
                          p.logId?.toString().includes(term);
      const matchDest = !this.selectedDestination || p.destination === this.selectedDestination;
      return matchSearch && matchDest;
    });
  }

  // Pagination Getters
  get paginatedProducts(): RecyclingProducts[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  setPage(page: number): void {
    this.currentPage = page;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
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