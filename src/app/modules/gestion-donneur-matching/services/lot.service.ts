import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LotRequest, LotResponse } from '../models/lot.model';
import { StatutLot, NiveauUrgence } from '../models/enums.model';

@Injectable({
  providedIn: 'root'
})
export class LotService {

  private baseUrl = 'http://localhost:8082/api/lots';

  constructor(private http: HttpClient) {}

  getAll(): Observable<LotResponse[]> {
    return this.http.get<LotResponse[]>(this.baseUrl);
  }

  getById(id: number): Observable<LotResponse> {
    return this.http.get<LotResponse>(`${this.baseUrl}/${id}`);
  }

  create(lot: LotRequest): Observable<LotResponse> {
    return this.http.post<LotResponse>(this.baseUrl, lot);
  }

  update(id: number, lot: LotRequest): Observable<LotResponse> {
    return this.http.put<LotResponse>(`${this.baseUrl}/${id}`, lot);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  changerStatut(id: number, statut: StatutLot): Observable<LotResponse> {
    return this.http.put<LotResponse>(`${this.baseUrl}/${id}/statut?nouveau=${statut}`, {});
  }

  getByStatut(statut: StatutLot): Observable<LotResponse[]> {
    return this.http.get<LotResponse[]>(`${this.baseUrl}/statut/${statut}`);
  }

  getByUrgence(urgence: NiveauUrgence): Observable<LotResponse[]> {
    return this.http.get<LotResponse[]>(`${this.baseUrl}/urgence/${urgence}`);
  }

  getByDonneurId(donneurId: number): Observable<LotResponse[]> {
    return this.http.get<LotResponse[]>(`${this.baseUrl}/donneur/${donneurId}`);
  }

  getCritiquesNonTraites(): Observable<LotResponse[]> {
    return this.http.get<LotResponse[]>(`${this.baseUrl}/critiques-non-traites`);
  }

  getDisponiblesPourMatching(): Observable<LotResponse[]> {
    return this.http.get<LotResponse[]>(`${this.baseUrl}/disponibles-matching`);
  }
}