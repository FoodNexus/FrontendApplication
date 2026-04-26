import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReceveurService, Besoin } from '../../../services/receveur.service';

@Component({
  selector: 'app-besoin-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './besoin-form.component.html',
  styleUrls: ['./besoin-form.component.scss']
})
export class BesoinFormComponent implements OnInit {
  userId = 1;
  isEditMode = false;
  besoinId: number | null = null;
  isLoading = false;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  besoin: Partial<Besoin> = {
    stockageId: this.userId,
    typeProduit: '',
    quantiteKg: 0,
    description: '',
    dateExpiration: ''
  };

  constructor(
    private receveurService: ReceveurService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.besoinId = this.route.snapshot.params['id'];
    if (this.besoinId) {
      this.isEditMode = true;
      this.loadBesoin();
    }
  }

  loadBesoin(): void {
    this.isLoading = true;
    this.receveurService.getBesoin(this.besoinId!).subscribe({
      next: (data) => {
        this.besoin = data;
        if (data.dateExpiration) {
          const date = new Date(data.dateExpiration);
          this.besoin.dateExpiration = date.toISOString().split('T')[0] as any;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = 'Impossible de charger le besoin';
        this.isLoading = false;
      }
    });
  }

  // Validation sans contrôle de date
  isFormValid(): boolean {
    if (!this.besoin.typeProduit || !this.besoin.quantiteKg || this.besoin.quantiteKg <= 0) {
      return false;
    }
    // ✅ VALIDATION DATE COMMENTÉE POUR TEST
    return true;
  }

  save(): void {
    // ✅ VALIDATION DATE COMMENTÉE POUR TEST
    if (!this.besoin.typeProduit || !this.besoin.quantiteKg || this.besoin.quantiteKg <= 0) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const dataToSend: any = {
      stockageId: this.besoin.stockageId,
      typeProduit: this.besoin.typeProduit,
      quantiteKg: this.besoin.quantiteKg,
      description: this.besoin.description
    };

    if (this.besoin.dateExpiration) {
      dataToSend.dateExpiration = this.besoin.dateExpiration;
    }

    if (this.isEditMode && this.besoinId) {
      this.receveurService.updateBesoin(this.besoinId, dataToSend).subscribe({
        next: () => {
          this.successMessage = 'Besoin modifié avec succès !';
          setTimeout(() => this.router.navigate(['/receveur/besoins']), 1500);
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.errorMessage = 'Erreur lors de la modification';
          this.isSaving = false;
        }
      });
    } else {
      this.receveurService.createBesoin(dataToSend).subscribe({
        next: () => {
          this.successMessage = 'Besoin créé avec succès !';
          setTimeout(() => this.router.navigate(['/receveur/besoins']), 1500);
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.errorMessage = 'Erreur lors de la création';
          this.isSaving = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/receveur/besoins']);
  }

  getTitle(): string {
    return this.isEditMode ? 'Modifier le besoin' : 'Nouveau besoin';
  }

  getButtonText(): string {
    return this.isSaving ? 'Enregistrement...' : (this.isEditMode ? 'Modifier' : 'Créer');
  }
}