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

  getByDonor(donorId: number): Observable<DigitalContract[]> {
    return this.http.get<DigitalContract[]>(
      `${this.apiUrl}/donor/${donorId}`
    );
  }

  getByReceiver(receiverId: number): Observable<DigitalContract[]> {
    return this.http.get<DigitalContract[]>(
      `${this.apiUrl}/receiver/${receiverId}`
    );
  }

  getByDelivery(deliveryId: number): Observable<DigitalContract> {
    return this.http.get<DigitalContract>(
      `${this.apiUrl}/delivery/${deliveryId}`
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
