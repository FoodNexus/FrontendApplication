import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InspectionCase, ResolutionStatus, SanitaryVerdict } 
  from '../../../models/inspection-case.model';
import { InspectionCaseService } 
  from '../../../services/inspection-case.service';

@Component({
  selector: 'app-inspection-case-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './inspection-case-list.component.html',
  styleUrls: ['./inspection-case-list.component.scss']
})
export class InspectionCaseListComponent implements OnInit {

  inspectionCases: InspectionCase[] = [];
  loading = false;
  errorMessage = '';

  constructor(private service: InspectionCaseService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.inspectionCases = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur de chargement';
        this.loading = false;
      }
    });
  }

  delete(id: number): void {
    if (confirm('Voulez-vous supprimer ce dossier ?')) {
      this.service.delete(id).subscribe({
        next: () => this.loadAll(),
        error: () => this.errorMessage = 'Erreur de suppression'
      });
    }
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'EN_COURS': return 'badge bg-warning text-dark';
      case 'RESOLU':   return 'badge bg-success';
      case 'FERME':    return 'badge bg-secondary';
      default:         return 'badge bg-light';
    }
  }

  getVerdictClass(verdict: string): string {
    switch (verdict) {
      case 'PROPRE_A_LA_CONSOMMATION': return 'badge bg-success';
      case 'DESTRUCTION_RECYCLAGE':    return 'badge bg-danger';
      default:                          return 'badge bg-light';
    }
  }
}