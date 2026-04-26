import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReceveurService, Notation } from '../../../services/receveur.service';

@Component({
  selector: 'app-notation-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './notation-form.component.html',
  styleUrls: ['./notation-form.component.scss']
})
export class NotationFormComponent implements OnInit {
  userId = 1;
  donId: number | null = null;
  isLoading = false;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  notation: Partial<Notation> = {
  stockageId: this.userId,
  donId: undefined,  // ← Changé : null → undefined
  note: 5,
  commentaire: ''
};

  constructor(
    private receveurService: ReceveurService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.donId = this.route.snapshot.params['donId'];
    if (this.donId) {
      this.notation.donId = this.donId;
    } else {
      this.errorMessage = 'Don ID manquant';
    }
  }

  setNote(note: number): void {
    this.notation.note = note;
  }

  save(): void {
    if (!this.notation.donId) {
      this.errorMessage = 'Don ID manquant';
      return;
    }

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.receveurService.createNotation(this.notation).subscribe({
      next: () => {
        this.successMessage = 'Notation enregistrée avec succès !';
        this.isSaving = false;
        setTimeout(() => {
          this.router.navigate(['/receveur/notations']);
        }, 1500);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = err.error?.message || 'Erreur lors de l\'enregistrement';
        this.isSaving = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/receveur/notations']);
  }

  getStarsArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  getNoteLabel(note: number): string {
    switch(note) {
      case 1: return 'Très insatisfait';
      case 2: return 'Insatisfait';
      case 3: return 'Neutre';
      case 4: return 'Satisfait';
      case 5: return 'Très satisfait';
      default: return '';
    }
  }
}
