
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReceveurService, Besoin } from '../../../services/receveur.service';

@Component({
  selector: 'app-besoin-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './besoin-list.component.html',
  styleUrls: ['./besoin-list.component.scss']
})
export class BesoinListComponent implements OnInit {
  userId = 1;
  besoins: Besoin[] = [];
  filteredBesoins: Besoin[] = [];
  isLoading = true;
  errorMessage = '';
  filterStatut: string = 'TOUS';
  searchTerm: string = '';

  showExpirationAlert = false;
  expirationMessage = '';
  alertType = 'warning';

  constructor(private receveurService: ReceveurService) { }

  ngOnInit(): void {
    this.loadBesoins();
    this.checkExpiredBesoins();

    setInterval(() => {
      this.checkExpiredBesoins();
    }, 60000);
  }

  loadBesoins(): void {
    this.isLoading = true;
    this.receveurService.getBesoins(this.userId).subscribe({
      next: (data) => {
        this.besoins = data;
        this.applyFilters();
        this.isLoading = false;

        this.besoins.forEach(besoin => {
          if (besoin.dateExpiration && besoin.statut !== 'EXPIRE') {
            const joursRestants = this.getJoursRestants(besoin.dateExpiration);
            this.checkAndAlert(joursRestants, besoin.typeProduit);
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur de chargement';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.besoins];
    if (this.filterStatut !== 'TOUS') {
      filtered = filtered.filter(b => b.statut === this.filterStatut);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.typeProduit.toLowerCase().includes(term) ||
        b.description?.toLowerCase().includes(term)
      );
    }
    this.filteredBesoins = filtered;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  deleteBesoin(id: number): void {
    if (confirm('Supprimer ce besoin ?')) {
      this.receveurService.deleteBesoin(id).subscribe({
        next: () => this.loadBesoins(),
        error: (err) => console.error(err)
      });
    }
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return 'status-pending';
      case 'SATISFAIT': return 'status-satisfied';
      case 'EXPIRE': return 'status-expired';
      default: return '';
    }
  }

  getStatutText(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return 'En attente';
      case 'SATISFAIT': return 'Satisfait';
      case 'EXPIRE': return 'Expiré';
      default: return statut;
    }
  }

  getBesoinsByStatut(statut: string): number {
    return this.besoins.filter(b => b.statut === statut).length;
  }

  checkExpiredBesoins(): void {
    this.receveurService.getBesoins(this.userId).subscribe({
      next: (data) => {
        const expired = data.filter(b => b.statut === 'EXPIRE');
        if (expired.length > 0) {
          this.showExpirationAlert = true;
          const noms = expired.map(b => b.typeProduit).join(', ');
          this.expirationMessage = `${expired.length} besoin(s) expiré(s) : ${noms}.`;
          setTimeout(() => {
            this.showExpirationAlert = false;
          }, 10000);
        } else {
          this.showExpirationAlert = false;
        }
      },
      error: (err) => console.error('Erreur vérification expiration:', err)
    });
  }

  nettoyerExpires(): void {
    this.receveurService.nettoyerBesoinsExpires().subscribe({
      next: () => {
        this.loadBesoins();
        this.showExpirationAlert = false;
        alert('Besoins expirés nettoyés');
      },
      error: (err: any) => {
        console.error('Erreur nettoyage:', err);
        alert('Erreur lors du nettoyage');
      }
    });
  }

  getJoursRestants(dateExpiration: Date | string): number {
    if (!dateExpiration) return 999;
    const expiration = new Date(dateExpiration);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    expiration.setHours(0, 0, 0, 0);
    const diffTime = expiration.getTime() - aujourdhui.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  getAlerteExpiration(joursRestants: number): { message: string; type: string; icon: string } {
    if (joursRestants < 0) {
      return { message: 'Besoin expiré', type: 'expired', icon: '!' };
    } else if (joursRestants === 0) {
      return { message: 'Dernier jour - Expire aujourd\'hui', type: 'critical', icon: '!' };
    } else if (joursRestants <= 3) {
      return { message: `Urgent - Expire dans ${joursRestants} jour${joursRestants > 1 ? 's' : ''}`, type: 'urgent', icon: '!' };
    } else if (joursRestants <= 7) {
      return { message: `Attention - Expire dans ${joursRestants} jours`, type: 'warning', icon: '!' };
    } else {
      return { message: `${joursRestants} jours restants`, type: 'normal', icon: 'i' };
    }
  }

  checkAndAlert(joursRestants: number, besoinNom: string): void {
    if (joursRestants === 7) {
      this.showTemporaryAlert(`Le besoin "${besoinNom}" expire dans 7 jours`, 'warning');
    } else if (joursRestants === 3) {
      this.showTemporaryAlert(`URGENT - Le besoin "${besoinNom}" expire dans 3 jours`, 'urgent');
    } else if (joursRestants === 1) {
      this.showTemporaryAlert(`CRITIQUE - Le besoin "${besoinNom}" expire demain`, 'critical');
    }
  }

  showTemporaryAlert(message: string, type: string): void {
    this.showExpirationAlert = true;
    this.expirationMessage = message;
    this.alertType = type;
    setTimeout(() => {
      this.showExpirationAlert = false;
    }, 8000);
  }


}
