import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Stockage {
  id: number;
  userId: number;
  capaciteMaxKg: number;
  capaciteDisponibleKg: number;
  aFrigorifique: boolean;
  capaciteFrigoKg: number;
  dateCreation: Date;
}

export interface Besoin {
  id: number;
  stockageId: number;
  typeProduit: string;
  quantiteKg: number;
  description: string;
  dateExpiration: Date | string;
  statut: string;
  dateCreation: Date;
}

export interface Notation {
  id: number;
  stockageId: number;
  donId: number;
  note: number;
  commentaire: string;
  dateNotation: Date;
}

import { APP_CONFIG } from '../../../app.constants';

@Injectable({
  providedIn: 'root'
})
export class ReceveurService {
  // Définir l'URL directement
  private apiUrl = APP_CONFIG.RECEVEUR_API;

  constructor(private http: HttpClient) { }

  // ========== STOCKAGE CRUD ==========

  getStockage(userId: number): Observable<Stockage> {
    return this.http.get<Stockage>(`${this.apiUrl}/stockages/${userId}`);
  }

  createStockage(userId: number, data: Partial<Stockage>): Observable<Stockage> {
    return this.http.post<Stockage>(`${this.apiUrl}/stockages/${userId}`, data);
  }

  updateStockage(userId: number, data: Partial<Stockage>): Observable<Stockage> {
    return this.http.put<Stockage>(`${this.apiUrl}/stockages/${userId}`, data);
  }

  deleteStockage(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/stockages/${userId}`);
  }

  canReceiveDon(userId: number, quantiteKg: number, besoinFrigo: boolean): Observable<any> {
    return this.http.get(`${this.apiUrl}/stockages/${userId}/peut-recevoir`, {
      params: { quantiteKg, besoinFrigo: String(besoinFrigo) }
    });
  }

  // ========== BESOINS CRUD ==========

  getBesoins(userId: number): Observable<Besoin[]> {
    return this.http.get<Besoin[]>(`${this.apiUrl}/besoins/utilisateur/${userId}`);
  }

  getBesoin(id: number): Observable<Besoin> {
    return this.http.get<Besoin>(`${this.apiUrl}/besoins/${id}`);
  }

  createBesoin(data: Partial<Besoin>): Observable<Besoin> {
    return this.http.post<Besoin>(`${this.apiUrl}/besoins`, data);
  }

  updateBesoin(id: number, data: Partial<Besoin>): Observable<Besoin> {
    return this.http.put<Besoin>(`${this.apiUrl}/besoins/${id}`, data);
  }

  deleteBesoin(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/besoins/${id}`);
  }

  // ========== NOTATIONS CRUD ==========

  getNotations(userId: number): Observable<Notation[]> {
    return this.http.get<Notation[]>(`${this.apiUrl}/notations/utilisateur/${userId}`);
  }

  createNotation(data: Partial<Notation>): Observable<Notation> {
    return this.http.post<Notation>(`${this.apiUrl}/notations`, data);
  }

  getScoreMoyen(userId: number): Observable<{ scoreMoyen: number; nombreNotations: number }> {
    return this.http.get<{ scoreMoyen: number; nombreNotations: number }>(
      `${this.apiUrl}/notations/score-moyen/${userId}`
    );
  }
  // ========== NETTOYAGE ==========

  nettoyerBesoinsExpires(): Observable<string> {
    return this.http.post(`${this.apiUrl}/cleanup/run`, {}, { responseType: 'text' });
  }
}