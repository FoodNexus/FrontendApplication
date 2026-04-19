import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecyclingProducts, Destination } 
  from '../models/recycling-products.model';

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

  create(caseId: number, data: RecyclingProducts): Observable<RecyclingProducts> {
    return this.http.post<RecyclingProducts>(
      `${this.apiUrl}/inspection-case/${caseId}`,
      data
    );
  }

  getByInspectionCase(caseId: number): Observable<RecyclingProducts[]> {
    return this.http.get<RecyclingProducts[]>(
      `${this.apiUrl}/inspection-case/${caseId}`
    );
  }

  getByDestination(destination: Destination): Observable<RecyclingProducts[]> {
    return this.http.get<RecyclingProducts[]>(
      `${this.apiUrl}/destination/${destination}`
    );
  }

  updateDetails(id: number, weight: number,
                destination: Destination): Observable<RecyclingProducts> {
    return this.http.patch<RecyclingProducts>(
      `${this.apiUrl}/${id}/details?weight=${weight}&destination=${destination}`,
      {}
    );
  }

  update(id: number, data: RecyclingProducts): Observable<RecyclingProducts> {
    return this.http.put<RecyclingProducts>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}