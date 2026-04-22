import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OcrResult {
  codeBarre: string;
  produitDetecte: string;
  datePeremption: string;
  texteBrut: string;
  success: boolean;
  message: string;
}

export interface OcrCreateLotRequest {
  donneurId: number;
  quantite?: number;
  niveauUrgence?: string;
  lotIdExistant?: number;
}

export interface OcrCreateLotResponse {
  lotId: number;
  produitId: number;
  message: string;
  success: boolean;
}

@Injectable({ providedIn: 'root' })
export class OcrService {
  private readonly apiUrl = `${environment.matchingApiBaseUrl}/api/ocr`;

  constructor(private http: HttpClient) {}

  // ✅ Correspond à POST /api/ocr/analyser
  scanImage(imageFile: File): Observable<OcrResult> {
    const formData = new FormData();
    formData.append('image', imageFile);
    return this.http.post<OcrResult>(`${this.apiUrl}/analyser`, formData);
  }

  // ✅ Correspond à POST /api/ocr/creer-lot
  creerLotDepuisScan(imageFile: File, donneurId: number, quantite: number = 1): Observable<OcrCreateLotResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('donneurId', donneurId.toString());
    formData.append('quantite', quantite.toString());
    return this.http.post<OcrCreateLotResponse>(`${this.apiUrl}/creer-lot`, formData);
  }
}