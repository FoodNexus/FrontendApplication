import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InspectionCase, ResolutionStatus, SanitaryVerdict } 
  from '../models/inspection-case.model';

@Injectable({ providedIn: 'root' })
export class InspectionCaseService {

  private apiUrl = 'http://localhost:8083/api/inspection-cases';

  constructor(private http: HttpClient) {}

  getAll(): Observable<InspectionCase[]> {
    return this.http.get<InspectionCase[]>(this.apiUrl);
  }

  getById(id: number): Observable<InspectionCase> {
    return this.http.get<InspectionCase>(`${this.apiUrl}/${id}`);
  }

  getByAuditor(auditorId: number): Observable<InspectionCase[]> {
    return this.http.get<InspectionCase[]>(
      `${this.apiUrl}/auditor/${auditorId}`
    );
  }

  getByDelivery(deliveryId: number): Observable<InspectionCase[]> {
    return this.http.get<InspectionCase[]>(
      `${this.apiUrl}/delivery/${deliveryId}`
    );
  }

  getByStatus(status: ResolutionStatus): Observable<InspectionCase[]> {
    return this.http.get<InspectionCase[]>(
      `${this.apiUrl}/status/${status}`
    );
  }

  getByVerdict(verdict: SanitaryVerdict): Observable<InspectionCase[]> {
    return this.http.get<InspectionCase[]>(
      `${this.apiUrl}/verdict/${verdict}`
    );
  }

  create(data: InspectionCase): Observable<InspectionCase> {
    return this.http.post<InspectionCase>(this.apiUrl, data);
  }

  scan(image: File, auditorId: number, deliveryId: number, description?: string): Observable<InspectionCase> {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('auditorId', auditorId.toString());
    formData.append('deliveryId', deliveryId.toString());
    if (description) {
      formData.append('description', description);
    }
    return this.http.post<InspectionCase>(`${this.apiUrl}/scan`, formData);
  }

  analyze(image: File): Observable<{ sanitaryVerdict: SanitaryVerdict }> {
    const formData = new FormData();
    formData.append('image', image);
    return this.http.post<{ sanitaryVerdict: SanitaryVerdict }>(`${this.apiUrl}/analyze`, formData);
  }

  update(id: number, data: InspectionCase): Observable<InspectionCase> {
    return this.http.put<InspectionCase>(`${this.apiUrl}/${id}`, data);
  }

  updateStatus(id: number, 
               status: ResolutionStatus): Observable<InspectionCase> {
    return this.http.patch<InspectionCase>(
      `${this.apiUrl}/${id}/status?status=${status}`, {}
    );
  }

  updateVerdict(id: number, 
                verdict: SanitaryVerdict): Observable<InspectionCase> {
    return this.http.patch<InspectionCase>(
      `${this.apiUrl}/${id}/verdict?verdict=${verdict}`, {}
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}