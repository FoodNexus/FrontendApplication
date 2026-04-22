import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProduitRequest, ProduitResponse } from '../models/produit.model';
import { CategorieProduit } from '../models/enums.model';

@Injectable({
  providedIn: 'root'
})
export class ProduitService {

  private readonly baseUrl = `${environment.matchingApiBaseUrl}/api/produits`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ProduitResponse[]> {
    return this.http.get<ProduitResponse[]>(this.baseUrl);
  }

  getById(id: number): Observable<ProduitResponse> {
    return this.http.get<ProduitResponse>(`${this.baseUrl}/${id}`);
  }

  create(produit: ProduitRequest): Observable<ProduitResponse> {
    return this.http.post<ProduitResponse>(this.baseUrl, produit);
  }

  update(id: number, produit: ProduitRequest): Observable<ProduitResponse> {
    return this.http.put<ProduitResponse>(`${this.baseUrl}/${id}`, produit);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getByCodeBarre(codeBarre: string): Observable<ProduitResponse> {
    return this.http.get<ProduitResponse>(`${this.baseUrl}/code-barre/${codeBarre}`);
  }

  getByCategorie(categorie: CategorieProduit): Observable<ProduitResponse[]> {
    return this.http.get<ProduitResponse[]>(`${this.baseUrl}/categorie/${categorie}`);
  }

  rechercher(keyword: string): Observable<ProduitResponse[]> {
    return this.http.get<ProduitResponse[]>(`${this.baseUrl}/recherche?keyword=${keyword}`);
  }
}