import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { MatchingResultDTO, ReceveurSimule } from '../models/matching-result.model';

@Injectable({
  providedIn: 'root'
})
export class MatchingService {

  private baseUrl = `${environment.apiDonneurUrl}/api/matching`;

  constructor(private http: HttpClient) {}

  lancerMatching(lotId: number): Observable<MatchingResultDTO> {
    return this.http.post<MatchingResultDTO>(`${this.baseUrl}/lancer/${lotId}`, {});
  }

  simulerMatching(lotId: number): Observable<MatchingResultDTO> {
    return this.http.get<MatchingResultDTO>(`${this.baseUrl}/simuler/${lotId}`);
  }

  getReceveursSimules(): Observable<ReceveurSimule[]> {
    return this.http.get<ReceveurSimule[]>(`${this.baseUrl}/receveurs-simules`);
  }
}