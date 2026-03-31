import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DigitalContract } from '../../../models/digital-contract.model';
import { DigitalContractService } 
  from '../../../services/digital-contract.service';

@Component({
  selector: 'app-digital-contract-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './digital-contract-list.component.html',
  styleUrls: ['./digital-contract-list.component.scss']
})
export class DigitalContractListComponent implements OnInit {

  contracts: DigitalContract[] = [];
  loading = false;
  errorMessage = '';

  constructor(private service: DigitalContractService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.contracts = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur de chargement';
        this.loading = false;
      }
    });
  }

  delete(id: number): void {
    if (confirm('Voulez-vous supprimer ce contrat ?')) {
      this.service.delete(id).subscribe({
        next: () => this.loadAll(),
        error: () => this.errorMessage = 'Erreur de suppression'
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'GENERE':  return 'badge bg-primary';
      case 'ENVOYE':  return 'badge bg-success';
      case 'ARCHIVE': return 'badge bg-secondary';
      default:        return 'badge bg-light';
    }
  }
}