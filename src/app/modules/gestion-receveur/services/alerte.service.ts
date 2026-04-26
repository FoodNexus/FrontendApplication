import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Alerte {
  id: number;
  userId: number;
  besoinId: number;
  typeProduit: string;
  message: string;
  niveau: string;
  joursRestants: number;
  lue: boolean;
  dateEnvoi: Date;
  dateLecture: Date | null;
}

export interface AlerteStats {
  total: number;
  nonLues: number;
  info: number;
  warning: number;
  urgent: number;
  critical: number;
  infoNonLues: number;
  warningNonLues: number;
  urgentNonLues: number;
  criticalNonLues: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlerteService {
  private apiUrl = 'http://localhost:8080/api/receveur/alertes';

  constructor(private http: HttpClient) { }

  getNonLues(userId: number): Observable<Alerte[]> {
    return this.http.get<Alerte[]>(`${this.apiUrl}/non-lues/${userId}`);
  }

  getAll(userId: number): Observable<Alerte[]> {
    return this.http.get<Alerte[]>(`${this.apiUrl}/all/${userId}`);
  }

  getCount(userId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count/${userId}`);
  }

  getStats(userId: number): Observable<AlerteStats> {
    return this.http.get<AlerteStats>(`${this.apiUrl}/stats/${userId}`);
  }

  marquerLue(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/lue/${id}`, {});
  }

  marquerToutLu(userId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/tout-lu/${userId}`, {});
  }

  genererAlertes(): Observable<string> {
    return this.http.post(`${this.apiUrl}/generer`, {}, { responseType: 'text' });
  }
}