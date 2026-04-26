import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AlerteService, Alerte, AlerteStats } from '../../services/alerte.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent implements OnInit {
  userId = 1;
  alertes: Alerte[] = [];
  filteredAlertes: Alerte[] = [];
  unreadCount = 0;
  showDropdown = false;
  filter: string = 'all';
  stats: AlerteStats | null = null;
  isLoading = false;

  constructor(private alerteService: AlerteService) { }

  ngOnInit(): void {
    this.loadData();
    setInterval(() => this.loadData(), 30000);
  }

  loadData(): void {
    this.isLoading = true;

    this.alerteService.getNonLues(this.userId).subscribe({
      next: (data) => {
        this.alertes = data;
        this.unreadCount = data.length;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement alertes:', err);
        this.isLoading = false;
      }
    });

    this.alerteService.getStats(this.userId).subscribe({
      next: (data) => this.stats = data,
      error: (err) => console.error('Erreur stats:', err)
    });
  }

  applyFilter(): void {
    if (this.filter === 'all') {
      this.filteredAlertes = this.alertes;
    } else {
      this.filteredAlertes = this.alertes.filter(a =>
        a.niveau.toLowerCase() === this.filter.toLowerCase()
      );
    }
  }

  marquerLu(id: number): void {
    this.alerteService.marquerLue(id).subscribe({
      next: () => this.loadData()
    });
  }

  marquerToutLu(): void {
    this.alerteService.marquerToutLu(this.userId).subscribe({
      next: () => this.loadData()
    });
  }

  refresh(): void {
    this.loadData();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.loadData();
    }
  }

  setFilter(filter: string): void {
    this.filter = filter;
    this.applyFilter();
  }

  getIcon(niveau: string): string {
    switch (niveau) {
      case 'CRITICAL': return 'bi bi-x-circle-fill';
      case 'URGENT': return 'bi bi-exclamation-triangle-fill';
      case 'WARNING': return 'bi bi-clock-fill';
      default: return 'bi bi-info-circle-fill';
    }
  }

  getNiveauClass(niveau: string): string {
    return niveau.toLowerCase();
  }
}