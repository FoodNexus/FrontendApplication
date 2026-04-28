import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AlerteService, Alerte, AlerteStats } from '../../services/alerte.service';

@Component({
  selector: 'app-alertes-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './alertes-page.component.html',
  styleUrls: ['./alertes-page.component.scss']
})
export class AlertesPageComponent implements OnInit {
  userId = 1;
  alertes: Alerte[] = [];
  isLoading = true;
  stats: AlerteStats | null = null;
  filterNiveau: string = 'TOUS';

  constructor(private alerteService: AlerteService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    this.alerteService.getAll(this.userId).subscribe({
      next: (data) => {
        this.alertes = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });

    this.alerteService.getStats(this.userId).subscribe({
      next: (data) => this.stats = data,
      error: (err) => console.error(err)
    });
  }

  get filteredAlertes(): Alerte[] {
    if (this.filterNiveau === 'TOUS') {
      return this.alertes;
    }
    return this.alertes.filter(a => a.niveau === this.filterNiveau);
  }

  marquerLue(id: number): void {
    this.alerteService.marquerLue(id).subscribe({
      next: () => this.loadData()
    });
  }

  marquerToutLu(): void {
    this.alerteService.marquerToutLu(this.userId).subscribe({
      next: () => this.loadData()
    });
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

  getDateLabel(date: Date): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const jours = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (jours === 0) return "Aujourd'hui";
    if (jours === 1) return "Hier";
    if (jours < 7) return `Il y a ${jours} jours`;
    return d.toLocaleDateString();
  }
}