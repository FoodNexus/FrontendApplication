import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MatchFractionneRequest, MatchFractionneResponse } from '../models/match-fractionne.model';
import { StatutMatch } from '../models/enums.model';

@Injectable({
  providedIn: 'root'
})
export class MatchFractionneService {

  private baseUrl = 'http://localhost:8082/api/matchs';

  constructor(private http: HttpClient) {}

  getAll(): Observable<MatchFractionneResponse[]> {
    return this.http.get<MatchFractionneResponse[]>(this.baseUrl);
  }

  getById(id: number): Observable<MatchFractionneResponse> {
    return this.http.get<MatchFractionneResponse>(`${this.baseUrl}/${id}`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  changerStatut(id: number, statut: StatutMatch): Observable<MatchFractionneResponse> {
    return this.http.put<MatchFractionneResponse>(`${this.baseUrl}/${id}/statut?nouveau=${statut}`, {});
  }

  getByLotId(lotId: number): Observable<MatchFractionneResponse[]> {
    return this.http.get<MatchFractionneResponse[]>(`${this.baseUrl}/lot/${lotId}`);
  }

  getByReceveurId(receveurId: number): Observable<MatchFractionneResponse[]> {
    return this.http.get<MatchFractionneResponse[]>(`${this.baseUrl}/receveur/${receveurId}`);
  }

  getByStatut(statut: StatutMatch): Observable<MatchFractionneResponse[]> {
    return this.http.get<MatchFractionneResponse[]>(`${this.baseUrl}/statut/${statut}`);
  }

  getBestMatchsByLot(lotId: number): Observable<MatchFractionneResponse[]> {
    return this.http.get<MatchFractionneResponse[]>(`${this.baseUrl}/lot/${lotId}/best`);
  }
}