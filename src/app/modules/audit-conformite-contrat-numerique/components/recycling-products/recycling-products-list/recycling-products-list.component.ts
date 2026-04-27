import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecyclingProducts, Destination } from '../../../models/recycling-products.model';
import { RecyclingProductsService } from '../../../services/recycling-products.service';
import { AuthService } from '../../../../gestion-user/services/auth.service';
import {
  loadRecyclerRequests,
  RECYCLER_REQUESTS_CHANGED_EVENT,
  RecyclerRequest
} from '../../../../valorisation-organique-economie-circulaire/storage/recycler-operations.storage';
import { NUTRIFLOW_HUB_PULLED_EVENT } from '../../../../valorisation-organique-economie-circulaire/services/nutriflow-hub-sync.service';
import { NotificationBellComponent } from '../../notification-bell/notification-bell.component';

@Component({
  selector: 'app-recycling-products-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NotificationBellComponent],
  templateUrl: './recycling-products-list.component.html',
  styleUrls: ['./recycling-products-list.component.scss']
})
export class RecyclingProductsListComponent implements OnInit, OnDestroy {

  /** Dossiers issus du microservice audit (port 8083). */
  products: RecyclingProducts[] = [];
  /** Opérations NutriFlow validées par l'admin (stockage local / hub), hors API inspection. */
  nutriFlowVerified: RecyclerRequest[] = [];
  filteredProducts: RecyclingProducts[] = [];
  loading = false;
  errorMessage = '';
  searchTerm = '';
  selectedDestination = '';

  // Pagination
  currentPage = 1;
  pageSize = 6;

  destinationOptions = Object.values(Destination);

  private readonly onNutriFlowStorageChanged = (): void => {
    this.ngZone.run(() => this.refreshNutriFlow());
  };

  constructor(
    private service: RecyclingProductsService,
    private authService: AuthService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onNutriFlowStorageChanged);
      window.addEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, this.onNutriFlowStorageChanged);
    }
    if (!this.authService.getCurrentUser()) {
      this.authService.fetchUserProfile().subscribe(() => this.loadAll());
    } else {
      this.loadAll();
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener(NUTRIFLOW_HUB_PULLED_EVENT, this.onNutriFlowStorageChanged);
      window.removeEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, this.onNutriFlowStorageChanged);
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
        this.refreshNutriFlow();
      },
      error: () => {
        this.errorMessage = 'Erreur de chargement des produits liés aux dossiers d’inspection (API audit). Les opérations NutriFlow validées s’affichent tout de même ci‑dessous si disponibles.';
        this.products = [];
        this.filter();
        this.loading = false;
        this.refreshNutriFlow();
      }
    });
  }

  private refreshNutriFlow(): void {
    this.nutriFlowVerified = loadRecyclerRequests()
      .filter((r) => r.status === 'verified')
      .sort(
        (a, b) =>
          (b.verifiedAt ?? '').localeCompare(a.verifiedAt ?? '') ||
          b.requestedAt.getTime() - a.requestedAt.getTime()
      );
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

  get paginatedProducts(): RecyclingProducts[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.pageSize) || 1;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  setPage(page: number): void {
    this.currentPage = page;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
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
      case 'NUTRIFLOW':   return 'badge bg-primary';
      default:            return 'badge bg-warning text-dark';
    }
  }
}
