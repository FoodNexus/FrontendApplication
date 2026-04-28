import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReceveurService, Besoin } from '../../../services/receveur.service';

@Component({
  selector: 'app-besoin-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './besoin-detail.component.html',
  styleUrls: ['./besoin-detail.component.scss']
})
export class BesoinDetailComponent implements OnInit {
  besoinId: number | null = null;
  besoin: Besoin | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private receveurService: ReceveurService
  ) {}

  ngOnInit(): void {
    this.besoinId = this.route.snapshot.params['id'];
    if (this.besoinId) {
      this.loadBesoin();
    } else {
      this.errorMessage = 'ID du besoin non trouvé';
      this.isLoading = false;
    }
  }

  loadBesoin(): void {
    this.isLoading = true;
    this.receveurService.getBesoin(this.besoinId!).subscribe({
      next: (data) => {
        this.besoin = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = 'Impossible de charger le besoin';
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/receveur/besoins']);
  }

  edit(): void {
    this.router.navigate(['/receveur/besoins/edit', this.besoinId]);
  }

  deleteBesoin(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce besoin ?')) {
      this.receveurService.deleteBesoin(this.besoinId!).subscribe({
        next: () => {
          this.router.navigate(['/receveur/besoins']);
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.errorMessage = 'Erreur lors de la suppression';
        }
      });
    }
  }

  getStatutClass(statut: string): string {
    switch(statut) {
      case 'EN_ATTENTE': return 'status-pending';
      case 'SATISFAIT': return 'status-satisfied';
      case 'EXPIRE': return 'status-expired';
      default: return '';
    }
  }

  getStatutText(statut: string): string {
    switch(statut) {
      case 'EN_ATTENTE': return 'En attente';
      case 'SATISFAIT': return 'Satisfait';
      case 'EXPIRE': return 'Expiré';
      default: return statut;
    }
  }

  isExpired(dateExpiration: Date | string): boolean {
    if (!dateExpiration) return false;
    const expirationDate = new Date(dateExpiration);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expirationDate < today;
  }

  getDaysLeft(dateExpiration: Date | string): number {
    if (!dateExpiration) return 0;
    const expirationDate = new Date(dateExpiration);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}
