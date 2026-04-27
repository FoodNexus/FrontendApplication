import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecyclingProducts } from '../models/recycling-products.model';

@Injectable({ providedIn: 'root' })
export class RecyclingProductsService {

  private apiUrl = 'http://localhost:8083/api/recycling-products';

  constructor(private http: HttpClient) {}

  getAll(): Observable<RecyclingProducts[]> {
    return this.http.get<RecyclingProducts[]>(this.apiUrl);
  }

  getById(id: number): Observable<RecyclingProducts> {
    return this.http.get<RecyclingProducts>(`${this.apiUrl}/${id}`);
  }

  create(inspectionCaseId: number, data: Partial<RecyclingProducts>): Observable<RecyclingProducts> {
    return this.http.post<RecyclingProducts>(`${this.apiUrl}?inspectionCaseId=${inspectionCaseId}`, data);
  }

  updateDetails(id: number, weight: number, destination: string): Observable<RecyclingProducts> {
    return this.http.patch<RecyclingProducts>(
      `${this.apiUrl}/${id}?weight=${weight}&destination=${destination}`, {}
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
