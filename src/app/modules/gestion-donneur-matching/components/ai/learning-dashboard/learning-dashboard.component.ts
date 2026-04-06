import { Component, OnInit } from '@angular/core';
import { LearningService, ReceveurProfile } from '../../../services/learning.service';

@Component({
  selector: 'app-learning-dashboard',
  templateUrl: './learning-dashboard.component.html',
  styleUrls: ['./learning-dashboard.component.scss']
})
export class LearningDashboardComponent implements OnInit {
  receveurId = 1;
  selectedProfil: ReceveurProfile | null = null;
  tousLesProfils: ReceveurProfile[] = [];
  loading = false;
  loadingAll = false;
  error = '';

  constructor(private learningService: LearningService) {}

  ngOnInit(): void {
    this.chargerTous();
  }

  chargerProfil(): void {
    this.loading = true;
    this.error = '';
    this.selectedProfil = null;

    this.learningService.getProfilReceveur(this.receveurId).subscribe({
      next: (res: ReceveurProfile) => {
        this.selectedProfil = res;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Erreur lors du chargement du profil';
        this.loading = false;
      }
    });
  }

  chargerTous(): void {
    this.loadingAll = true;
    this.error = '';

    this.learningService.getAllProfils().subscribe({
      next: (res: ReceveurProfile[]) => {
        this.tousLesProfils = res;
        this.loadingAll = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Erreur lors du chargement des profils';
        this.loadingAll = false;
      }
    });
  }
}