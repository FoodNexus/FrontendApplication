import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InspectionCase, ResolutionStatus, SanitaryVerdict }
  from '../../../models/inspection-case.model';
import { InspectionCaseService }
  from '../../../services/inspection-case.service';
import { AuthService }
  from '../../../../gestion-user/services/auth.service';
import { NotificationBellComponent } from '../../notification-bell/notification-bell.component';

@Component({
  selector: 'app-inspection-case-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NotificationBellComponent],
  templateUrl: './inspection-case-list.component.html',
  styleUrls: ['./inspection-case-list.component.scss']
})
export class InspectionCaseListComponent implements OnInit {

  inspectionCases: InspectionCase[] = [];
  filteredCases: InspectionCase[] = [];
  loading = false;
  errorMessage = '';
  searchTerm = '';
  selectedVerdict = '';

  // Pagination
  currentPage = 1;
  pageSize = 6;

  // Stats
  totalCount = 0;
  enCoursCount = 0;
  resoluCount = 0;
  fermeCount = 0;

  sanitaryVerdictOptions = Object.values(SanitaryVerdict);

  constructor(
    private service: InspectionCaseService,
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
    const user = this.authService.getCurrentUser();
    
    // Si c'est un ADMIN, il voit tout, sinon on filtre par auditorId
    const requestOb$ = this.authService.hasRole('ADMIN') 
      ? this.service.getAll() 
      : this.service.getByAuditor(user?.idUser);

    requestOb$.subscribe({
      next: (data) => {
        this.inspectionCases = (data || []).sort((a, b) => b.caseId! - a.caseId!);
        this.filter();
        this.computeStats();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les dossiers d\'inspection.';
        this.loading = false;
      }
    });
  }

  computeStats(): void {
    this.totalCount = this.inspectionCases.length;
    this.enCoursCount = this.inspectionCases.filter(c => c.resolutionStatus === ResolutionStatus.EN_COURS).length;
    this.resoluCount = this.inspectionCases.filter(c => c.resolutionStatus === ResolutionStatus.RESOLU).length;
    this.fermeCount = this.inspectionCases.filter(c => c.resolutionStatus === ResolutionStatus.FERME).length;
  }

  onSearch(): void {
    this.currentPage = 1;
    this.filter();
  }

  filter(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredCases = this.inspectionCases.filter(c => {
      const matchSearch = (c.description?.toLowerCase().includes(term)) ||
                          (c.caseId?.toString().includes(term));
      const matchVerdict = !this.selectedVerdict || c.sanitaryVerdict === this.selectedVerdict;
      return matchSearch && matchVerdict;
    });
  }

  // Pagination Getters
  get paginatedCases(): InspectionCase[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredCases.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCases.length / this.pageSize);
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
    if (confirm('Êtes-vous sûr de vouloir supprimer ce dossier ?')) {
      this.service.delete(id).subscribe({
        next: () => this.loadAll(),
        error: () => this.errorMessage = 'Erreur lors de la suppression.'
      });
    }
  }

  changeStatus(item: InspectionCase): void {
    let nextStatus = ResolutionStatus.EN_COURS;
    if (item.resolutionStatus === ResolutionStatus.EN_COURS) nextStatus = ResolutionStatus.RESOLU;
    else if (item.resolutionStatus === ResolutionStatus.RESOLU) nextStatus = ResolutionStatus.FERME;
    else nextStatus = ResolutionStatus.EN_COURS; // boucle FERME -> EN_COURS

    if (confirm(`Voulez-vous changer le statut à "${this.getStatusLabel(nextStatus)}" ?`)) {
      this.service.updateStatus(item.caseId!, nextStatus).subscribe({
        next: () => {
          item.resolutionStatus = nextStatus;
          this.computeStats(); // Met à jour les compteurs en haut
        },
        error: () => this.errorMessage = 'Erreur lors de la modification du statut.'
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'EN_COURS': return 'badge-pill status-en-cours';
      case 'RESOLU':   return 'badge-pill status-resolu';
      case 'FERME':    return 'badge-pill status-ferme';
      default:         return 'badge-pill';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'EN_COURS': return 'bi-clock';
      case 'RESOLU':   return 'bi-check-circle';
      case 'FERME':    return 'bi-x-circle';
      default:         return 'bi-question-circle';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'EN_COURS': return 'En cours';
      case 'RESOLU':   return 'Résolu';
      case 'FERME':    return 'Fermé';
      default:         return status;
    }
  }

  getVerdictBadgeClass(verdict: string): string {
    switch (verdict) {
      case 'PROPRE_A_LA_CONSOMMATION': return 'badge-pill verdict-propre';
      case 'DESTRUCTION_RECYCLAGE':    return 'badge-pill verdict-recyclage';
      default:                          return 'badge-pill';
    }
  }

  getVerdictIcon(verdict: string): string {
    switch (verdict) {
      case 'PROPRE_A_LA_CONSOMMATION': return 'bi-shield-check';
      case 'DESTRUCTION_RECYCLAGE':    return 'bi-exclamation-triangle';
      default:                          return 'bi-question';
    }
  }

  getVerdictLabel(verdict: string): string {
    switch (verdict) {
      case 'PROPRE_A_LA_CONSOMMATION': return 'Consommable';
      case 'DESTRUCTION_RECYCLAGE':    return 'Recyclage';
      default:                          return verdict;
    }
  }
}