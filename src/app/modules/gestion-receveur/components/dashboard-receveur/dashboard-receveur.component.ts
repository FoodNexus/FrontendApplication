import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReceveurService, Stockage, Besoin, Notation } from '../../services/receveur.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'app-dashboard-receveur',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationBellComponent],
  templateUrl: './dashboard-receveur.component.html',
  styleUrls: ['./dashboard-receveur.component.scss']
})
export class DashboardReceveurComponent implements OnInit {
  userId = 1;
  stockage: Stockage | null = null;
  besoinsActifs: Besoin[] = [];
  recentNotations: Notation[] = [];

  isLoading = true;
  errorMessage = '';

  constructor(private receveurService: ReceveurService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.loadStockage();
    this.loadBesoins();
    this.loadNotations();
  }

  loadStockage(): void {
    this.receveurService.getStockage(this.userId).subscribe({
      next: (data) => {
        this.stockage = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  loadBesoins(): void {
    this.receveurService.getBesoins(this.userId).subscribe({
      next: (data) => {
        this.besoinsActifs = data.filter(b => b.statut === 'EN_ATTENTE');
      },
      error: (err) => console.error(err)
    });
  }

  loadNotations(): void {
    this.receveurService.getNotations(this.userId).subscribe({
      next: (data) => {
        this.recentNotations = data.slice(0, 5);
      },
      error: (err) => console.error(err)
    });
  }

  get occupationRate(): number {
    if (!this.stockage) return 0;
    const used = this.stockage.capaciteMaxKg - this.stockage.capaciteDisponibleKg;
    return Math.round((used / this.stockage.capaciteMaxKg) * 100);
  }

  get progressColor(): string {
    const rate = this.occupationRate;
    if (rate < 50) return '#27ae60';
    if (rate < 80) return '#f39c12';
    return '#e74c3c';
  }

  getNoteStars(note: number): string {
    return '★'.repeat(note) + '☆'.repeat(5 - note);
  }
}
