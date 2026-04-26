import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ReceveurService, Stockage } from '../../../services/receveur.service';

@Component({
  selector: 'app-stockage-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './stockage-detail.component.html',
  styleUrls: ['./stockage-detail.component.scss']
})
export class StockageDetailComponent implements OnInit {
  userId = 1;
  stockage: Stockage | null = null;
  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private receveurService: ReceveurService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStockage();
  }

  loadStockage(): void {
    this.isLoading = true;
    this.receveurService.getStockage(this.userId).subscribe({
      next: (data) => {
        this.stockage = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = 'Impossible de charger les informations de stockage';
        this.isLoading = false;
      }
    });
  }

  save(): void {
    if (!this.stockage) return;
    
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.receveurService.updateStockage(this.userId, this.stockage).subscribe({
      next: () => {
        this.successMessage = 'Stockage modifié avec succès !';
        this.isSaving = false;
        setTimeout(() => {
          this.router.navigate(['/receveur/stockage']);
        }, 1500);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = 'Erreur lors de la modification du stockage';
        this.isSaving = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/receveur/stockage']);
  }
}