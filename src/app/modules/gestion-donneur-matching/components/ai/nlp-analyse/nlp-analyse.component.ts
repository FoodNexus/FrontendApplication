import { Component } from '@angular/core';
import { NlpService, NlpResult, NlpCreateLotResponse } from '../../../services/nlp.service';

@Component({
  selector: 'app-nlp-analyse',
  templateUrl: './nlp-analyse.component.html',
  styleUrls: ['./nlp-analyse.component.scss']
})
export class NlpAnalyseComponent {
  texte = '';
  result: NlpResult | null = null;
  lotCree: NlpCreateLotResponse | null = null;
  loading = false;
  loadingCreation = false;
  error = '';

  constructor(private nlpService: NlpService) {}

  analyser(): void {
    if (!this.texte.trim()) return;
    this.loading = true;
    this.error = '';
    this.result = null;
    this.lotCree = null;

    this.nlpService.analyserTexte(this.texte).subscribe({
      next: (res: NlpResult) => {
        this.result = res;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Erreur lors de l\'analyse NLP';
        this.loading = false;
      }
    });
  }

  creerLot(): void {
    if (!this.result) return;
    this.loadingCreation = true;

    this.nlpService.creerLotDepuisTexte({
      texte: this.texte,
      donneurId: 1
    }).subscribe({
      next: (res: NlpCreateLotResponse) => {
        this.lotCree = res;
        this.loadingCreation = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Erreur lors de la création du lot';
        this.loadingCreation = false;
      }
    });
  }
}