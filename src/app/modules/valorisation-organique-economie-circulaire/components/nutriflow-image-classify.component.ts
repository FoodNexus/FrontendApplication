import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  NutriflowClassificationResult,
  NutriflowInferenceService
} from '../services/nutriflow-inference.service';

@Component({
  selector: 'app-nutriflow-image-classify',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, FormsModule],
  template: `
    <nav aria-label="Fil d’Ariane" class="small text-muted mb-3">
      <a routerLink="/valorisation/nutriflow-donor" class="text-decoration-none text-success">NutriFlow donateur</a>
      <span class="mx-1">/</span>
      <span>Analyse de votre photo</span>
    </nav>

    <h1 class="h4 text-success mb-2">
      <i class="bi bi-camera me-2"></i>Que contient cette photo&nbsp;?
    </h1>
    <p class="text-muted small mb-4">
      Ajoutez une photo de votre déchet. Nous indiquons une <strong>estimation</strong> : part recyclable, part
      organique, et des <strong>filières</strong> possibles (où ce type de déchet peut être orienté). Ce n’est qu’une
      aide&nbsp;; en cas de doute, suivez les consignes locales de tri.
    </p>

    <div class="card shadow-sm border-success border-opacity-25 mb-4">
      <div class="card-body">
        <label class="form-label fw-semibold" for="photo">Votre photo</label>
        <input
          id="photo"
          type="file"
          class="form-control form-control-sm"
          accept="image/*"
          (change)="onFile($event)"
        />
        <button
          type="button"
          class="btn btn-success mt-3"
          [disabled]="!selectedFile || loading"
          (click)="run()"
        >
          <span *ngIf="!loading"><i class="bi bi-search me-1"></i>Lancer l’analyse</span>
          <span *ngIf="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
          <span *ngIf="loading">Analyse en cours…</span>
        </button>
        <p *ngIf="error" class="text-danger small mt-3 mb-0">{{ error }}</p>
      </div>
    </div>

    <div *ngIf="result" class="card shadow-sm border border-light">
      <div class="card-body">
        <h2 class="h6 text-success mb-3">Résultat pour votre photo</h2>

        <div class="mb-3">
          <div class="d-flex justify-content-between align-items-baseline mb-1">
            <span>Recyclable</span>
            <strong class="text-success">{{ recyclablePercent() }}&nbsp;%</strong>
          </div>
          <div class="progress" style="height: 10px" role="progressbar" [attr.aria-valuenow]="recyclablePercent()">
            <div class="progress-bar bg-success" [style.width.%]="recyclablePercent()"></div>
          </div>
        </div>

        <div class="mb-4">
          <div class="d-flex justify-content-between align-items-baseline mb-1">
            <span>Organique</span>
            <strong class="text-secondary">{{ organicPercent() }}&nbsp;%</strong>
          </div>
          <div class="progress bg-light" style="height: 10px" role="progressbar" [attr.aria-valuenow]="organicPercent()">
            <div class="progress-bar bg-secondary" [style.width.%]="organicPercent()"></div>
          </div>
        </div>

        <div class="mb-4 pb-3 border-bottom" *ngIf="result.filieres?.length">
          <h3 class="h6 text-muted mb-2">Filières possibles</h3>
          <p class="small text-muted mb-3">
            Voici des pistes de traitement ou de valorisation souvent associées à ce type de déchet. Les pourcentages
            indiquent une priorité indicative, pas une obligation locale.
          </p>
          <ul class="list-unstyled small mb-0">
            <li *ngFor="let f of result.filieres" class="mb-3">
              <div class="fw-semibold text-dark">{{ filiereTitle(f.code) }}</div>
              <div class="text-muted">Pertinence estimée : {{ filierePercent(f.score) }}&nbsp;%</div>
              <div *ngIf="f.notes" class="text-muted fst-italic mt-1">{{ f.notes }}</div>
            </li>
          </ul>
        </div>

        <p class="small text-dark mb-0">{{ plainLanguageSummary() }}</p>
      </div>
    </div>
  `
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
