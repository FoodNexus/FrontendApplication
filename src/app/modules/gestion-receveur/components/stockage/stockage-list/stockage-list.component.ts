import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReceveurService, Stockage } from '../../../services/receveur.service';

@Component({
  selector: 'app-stockage-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './stockage-list.component.html',
  styleUrls: ['./stockage-list.component.scss']
})
export class StockageListComponent implements OnInit {
  userId = 1; // À remplacer par l'ID de l'utilisateur connecté

  stockage: Stockage | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(private receveurService: ReceveurService) {}

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

  get espaceUtilise(): number {
    if (!this.stockage) return 0;
    return this.stockage.capaciteMaxKg - this.stockage.capaciteDisponibleKg;
  }

  get tauxOccupation(): number {
    if (!this.stockage) return 0;
    return Math.round((this.espaceUtilise / this.stockage.capaciteMaxKg) * 100);
  }

  get progressColor(): string {
    const rate = this.tauxOccupation;
    if (rate < 50) return '#27ae60';
    if (rate < 80) return '#f39c12';
    return '#e74c3c';
  }

  get statutOccupation(): string {
    const rate = this.tauxOccupation;
    if (rate < 50) return 'Bon';
    if (rate < 80) return 'Moyen';
    return 'Critique';
  }

  refresh(): void {
    this.loadStockage();
  }
}