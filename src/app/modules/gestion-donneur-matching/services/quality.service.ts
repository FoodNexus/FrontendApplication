import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface QualityResult {
  score: number;
  niveau: string;
  recommandation: string;
  details: string;
  success: boolean;
  message: string;
}

export interface QualityDecisionResult {
  niveau: string;
  score: number;
  decision: string;
  statutLotModifie: boolean;
  nouveauStatut: string;
}

@Injectable({ providedIn: 'root' })
export class QualityService {
  private apiUrl = `${environment.apiDonneurUrl}/api/quality`;

  constructor(private http: HttpClient) {}

  // ✅ Correspond à POST /api/quality/analyser
  analyserQualite(imageFile: File): Observable<QualityResult> {
    const formData = new FormData();
    formData.append('image', imageFile);
    return this.http.post<QualityResult>(`${this.apiUrl}/analyser`, formData);
  }

  // ✅ Correspond à POST /api/quality/analyser-et-decider/{lotId}
  analyserEtDecider(imageFile: File, lotId: number): Observable<QualityDecisionResult> {
    const formData = new FormData();
    formData.append('image', imageFile);
    return this.http.post<QualityDecisionResult>(`${this.apiUrl}/analyser-et-decider/${lotId}`, formData);
  }
}