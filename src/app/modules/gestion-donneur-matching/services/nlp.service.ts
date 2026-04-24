import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface NlpResult {
  produitDetecte: string;
  categorie: string;
  quantite: number;
  unite: string;
  datePeremption: string;
  urgence: string;
  success: boolean;
  message: string;
}

export interface NlpCreateLotRequest {
  texte: string;
  donneurId: number;
}

export interface NlpCreateLotResponse {
  lotId: number;
  produitId: number;
  message: string;
  success: boolean;
}

@Injectable({ providedIn: 'root' })
export class NlpService {
  private apiUrl = `${environment.apiDonneurUrl}/api/nlp`;

  constructor(private http: HttpClient) {}

  // ✅ Correspond à POST /api/nlp/analyser
  analyserTexte(texte: string): Observable<NlpResult> {
    return this.http.post<NlpResult>(`${this.apiUrl}/analyser`, { texte });
  }

  // ✅ Correspond à POST /api/nlp/creer-lot
  creerLotDepuisTexte(request: NlpCreateLotRequest): Observable<NlpCreateLotResponse> {
    return this.http.post<NlpCreateLotResponse>(`${this.apiUrl}/creer-lot`, request);
  }
}