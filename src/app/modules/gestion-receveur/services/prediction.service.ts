import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BesoinPrediction {
  typeProduit: string;
  quantitePrediteKg: number;
  dateEstimee: string;
  niveauUrgence: string;
  niveauConfiance: string;
  raison: string;
}

export interface PredictionResult {
  predictions: BesoinPrediction[];
  gainEstimeKg: number;
  niveauConfianceGlobal: string;
}

@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  private apiUrl = 'http://localhost:8080/api/receveur/predictions';

  constructor(private http: HttpClient) {}

  predireBesoins(userId: number, horizonJours: number): Observable<PredictionResult> {
    return this.http.get<PredictionResult>(`${this.apiUrl}/${userId}`, {
      params: { horizonJours: horizonJours.toString() }
    });
  }

  getRecommendations(userId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${userId}/recommendations`);
  }

  genererDonneesTest(userId: number, count: number): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/${userId}/generer-test`, null, {
      params: { count: count.toString() }
    });
  }
}
