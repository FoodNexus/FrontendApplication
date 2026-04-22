import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HistoriqueRequest, HistoriqueResponse } from '../models/historique.model';

@Injectable({
  providedIn: 'root'
})
export class HistoriqueService {

  private readonly baseUrl = `${environment.matchingApiBaseUrl}/api/historiques`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<HistoriqueResponse[]> {
    return this.http.get<HistoriqueResponse[]>(this.baseUrl);
  }

  getById(id: number): Observable<HistoriqueResponse> {
    return this.http.get<HistoriqueResponse>(`${this.baseUrl}/${id}`);
  }

  create(historique: HistoriqueRequest): Observable<HistoriqueResponse> {
    return this.http.post<HistoriqueResponse>(this.baseUrl, historique);
  }

  update(id: number, historique: HistoriqueRequest): Observable<HistoriqueResponse> {
    return this.http.put<HistoriqueResponse>(`${this.baseUrl}/${id}`, historique);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getByLotId(lotId: number): Observable<HistoriqueResponse[]> {
    return this.http.get<HistoriqueResponse[]>(`${this.baseUrl}/lot/${lotId}`);
  }

  getPeremptionProche(): Observable<HistoriqueResponse[]> {
    return this.http.get<HistoriqueResponse[]>(`${this.baseUrl}/peremption-proche`);
  }

  getPerimes(): Observable<HistoriqueResponse[]> {
    return this.http.get<HistoriqueResponse[]>(`${this.baseUrl}/perimes`);
  }

  getQuantiteTotaleLot(lotId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/lot/${lotId}/quantite-totale`);
  }
}