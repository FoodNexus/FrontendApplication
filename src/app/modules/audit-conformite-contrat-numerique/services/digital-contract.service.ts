import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DigitalContract, ContractStatus } 
  from '../models/digital-contract.model';

@Injectable({ providedIn: 'root' })
export class DigitalContractService {

  private apiUrl = 'http://localhost:8083/api/contracts';

  constructor(private http: HttpClient) {}

  getAll(): Observable<DigitalContract[]> {
    return this.http.get<DigitalContract[]>(this.apiUrl);
  }

  getById(id: number): Observable<DigitalContract> {
    return this.http.get<DigitalContract>(`${this.apiUrl}/${id}`);
  }

  getByDonorName(donorName: string): Observable<DigitalContract[]> {
    return this.http.get<DigitalContract[]>(
      `${this.apiUrl}/donor/${donorName}`
    );
  }

  getByReceiverName(receiverName: string): Observable<DigitalContract[]> {
    return this.http.get<DigitalContract[]>(
      `${this.apiUrl}/receiver/${receiverName}`
    );
  }

  getByDelivery(delevry_to: string): Observable<DigitalContract> {
    return this.http.get<DigitalContract>(
      `${this.apiUrl}/delivery/${delevry_to}`
    );
  }

  getByStatus(status: ContractStatus): Observable<DigitalContract[]> {
    return this.http.get<DigitalContract[]>(
      `${this.apiUrl}/status/${status}`
    );
  }

  create(data: DigitalContract): Observable<DigitalContract> {
    return this.http.post<DigitalContract>(this.apiUrl, data);
  }

  update(id: number, data: DigitalContract): Observable<DigitalContract> {
    return this.http.put<DigitalContract>(`${this.apiUrl}/${id}`, data);
  }

  updateStatus(id: number, 
               status: ContractStatus): Observable<DigitalContract> {
    return this.http.patch<DigitalContract>(
      `${this.apiUrl}/${id}/status?status=${status}`, {}
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
