import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DigitalContract, ContractStatus }
  from '../../../models/digital-contract.model';
import { DigitalContractService }
  from '../../../services/digital-contract.service';
import { NotificationBellComponent } from '../../notification-bell/notification-bell.component';

@Component({
  selector: 'app-digital-contract-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NotificationBellComponent],
  templateUrl: './digital-contract-list.component.html',
  styleUrls: ['./digital-contract-list.component.scss']
})
export class DigitalContractListComponent implements OnInit {

  contracts: DigitalContract[] = [];
  filteredContracts: DigitalContract[] = [];
  loading = false;
  errorMessage = '';
  searchTerm = '';

  // Pagination
  currentPage = 1;
  pageSize = 6;

  // Stats
  totalCount = 0;
  genereCount = 0;
  envoyeCount = 0;
  archiveCount = 0;

  constructor(private service: DigitalContractService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.contracts = (data || []).sort((a, b) => b.contractId! - a.contractId!);
        this.onSearch();
        this.computeStats();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les contrats.';
        this.loading = false;
      }
    });
  }

  computeStats(): void {
    this.totalCount = this.contracts.length;
    this.genereCount = this.contracts.filter(c => c.status === ContractStatus.GENERE).length;
    this.envoyeCount = this.contracts.filter(c => c.status === ContractStatus.ENVOYE).length;
    this.archiveCount = this.contracts.filter(c => c.status === ContractStatus.ARCHIVE).length;
  }

  onSearch(): void {
    this.currentPage = 1;
    const term = this.searchTerm.toLowerCase();
    this.filteredContracts = this.contracts.filter(c =>
      (c.contractId?.toString().includes(term)) ||
      (c.status?.toLowerCase().includes(term)) ||
      (c.donorName?.toLowerCase().includes(term)) ||
      (c.receiverName?.toLowerCase().includes(term)) ||
      (c.pdfDocumentUrl?.toLowerCase().includes(term))
    );
  }

  // Pagination Getters
  get paginatedContracts(): DigitalContract[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredContracts.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredContracts.length / this.pageSize);
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
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      this.service.delete(id).subscribe({
        next: () => this.loadAll(),
        error: () => this.errorMessage = 'Erreur lors de la suppression.'
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'GENERE':  return 'badge-pill status-genere';
      case 'ENVOYE':  return 'badge-pill status-envoye';
      case 'ARCHIVE': return 'badge-pill status-archive';
      default:        return 'badge-pill';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'GENERE':  return 'bi-file-earmark-plus';
      case 'ENVOYE':  return 'bi-send-check';
      case 'ARCHIVE': return 'bi-archive';
      default:        return 'bi-question-circle';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'GENERE':  return 'Généré';
      case 'ENVOYE':  return 'Envoyé';
      case 'ARCHIVE': return 'Archivé';
      default:        return status;
    }
  }
}