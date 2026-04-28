import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ReceveurService } from '../../../services/receveur.service';

@Component({
  selector: 'app-stockage-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './stockage-form.component.html',
  styleUrls: ['./stockage-form.component.scss']
})
export class StockageFormComponent {
  stockage = {
    userId: 1,  // À remplacer par l'ID de l'utilisateur connecté
    capaciteMaxKg: null as number | null,
    aFrigorifique: false,
    capaciteFrigoKg: 0
  };

  isSaving = false;
  successMessage = '';
  errorMessage = '';

  constructor(private router: Router, private receveurService: ReceveurService) { }

  get isFormValid(): boolean {
    return !!this.stockage.capaciteMaxKg && this.stockage.capaciteMaxKg > 0;
  }

  saveStockage(): void {
    if (!this.isFormValid) return;

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Nettoyer les données : remplacer null par undefined
    const dataToSend: any = {
      userId: this.stockage.userId,
      capaciteMaxKg: this.stockage.capaciteMaxKg || undefined,
      aFrigorifique: this.stockage.aFrigorifique,
      capaciteFrigoKg: this.stockage.capaciteFrigoKg
    };

    this.receveurService.createStockage(this.stockage.userId, dataToSend).subscribe({
      next: () => {
        this.successMessage = 'Votre espace de stockage a été créé avec succès !';
        this.isSaving = false;
        setTimeout(() => {
          this.router.navigate(['/receveur/dashboard']);
        }, 2000);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = 'Erreur lors de la création de votre espace de stockage. Veuillez réessayer.';
        this.isSaving = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/receveur/dashboard']);
  }
}