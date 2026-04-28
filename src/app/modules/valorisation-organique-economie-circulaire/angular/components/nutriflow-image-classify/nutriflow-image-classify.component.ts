import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  NutriflowClassificationResult,
  NutriflowInferenceService
} from '../../services/nutriflow-inference.service';

@Component({
  selector: 'app-nutriflow-image-classify',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, FormsModule],
  templateUrl: './nutriflow-image-classify.component.html'
})
export class NutriFlowImageClassifyComponent {
  /** Libellés utilisateurs pour les codes renvoyés par l’API (complétez si vous ajoutez des codes). */
  private static readonly FILIERE_TITLES: Record<string, string> = {
    METHANISATION: 'Méthanisation',
    COMPOST: 'Compostage',
    TRI_SELECTIF: 'Tri sélectif (recyclage)',
    VALORISATION_MATIERE: 'Valorisation des matériaux'
  };

  selectedFile: File | null = null;
  loading = false;
  error = '';
  result: NutriflowClassificationResult | null = null;

  constructor(private readonly inference: NutriflowInferenceService) {}

  onFile(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    this.selectedFile = f;
    this.error = '';
    this.result = null;
  }

  run(): void {
    if (!this.selectedFile) {
      return;
    }
    this.loading = true;
    this.error = '';
    this.result = null;
    this.inference.classifyImage(this.selectedFile).subscribe({
      next: (r) => {
        this.result = r;
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.error =
          e?.error?.detail ??
          e?.message ??
          "L'analyse n'a pas pu aboutir. Réessayez plus tard ou vérifiez votre connexion.";
      }
    });
  }

  /** Part « recyclable » (libellé R côté modèle). */
  recyclablePercent(): number {
    return this.percentForCode('R');
  }

  /** Part « organique » (libellé O côté modèle). */
  organicPercent(): number {
    return this.percentForCode('O');
  }

  private percentForCode(code: string): number {
    const c = this.result?.categories.find((x) => x.label.toUpperCase() === code.toUpperCase());
    return c != null ? Math.round(c.score * 1000) / 10 : 0;
  }

  filiereTitle(code: string): string {
    const k = (code ?? '').toUpperCase();
    if (NutriFlowImageClassifyComponent.FILIERE_TITLES[k]) {
      return NutriFlowImageClassifyComponent.FILIERE_TITLES[k];
    }
    return k
      .split('_')
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  }

  filierePercent(score: number): number {
    return Math.round(Math.min(1, Math.max(0, score)) * 1000) / 10;
  }

  plainLanguageSummary(): string {
    if (!this.result?.categories.length) {
      return '';
    }
    const r = this.recyclablePercent();
    const o = this.organicPercent();
    if (r >= o && r - o >= 15) {
      return (
        'D’après cette photo, il est plutôt probable que le déchet soit majoritairement recyclable. ' +
        'Vérifiez tout de même sur l’emballage ou auprès de votre commune.'
      );
    }
    if (o >= r && o - r >= 15) {
      return (
        'D’après cette photo, il est plutôt probable que le déchet soit majoritairement organique ' +
        '(restes alimentaires, compost, etc.). En cas de doute, évitez de mélanger avec le recyclage.'
      );
    }
    return (
      'La photo ne permet pas de trancher clairement : le déchet semble à cheval entre recyclable et organique. ' +
      'Regardez les pictogrammes sur le produit ou demandez conseil localement.'
    );
  }
}
