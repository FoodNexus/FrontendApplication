import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuditStatisticsService {

  private readonly API_URL = 'http://localhost:8083/api/audit/statistics';

  constructor(private http: HttpClient) {}

  /** Query 1: Global aggregated stats for an auditor */
  getGlobalStats(auditorId?: number): Observable<any> {
    const url = auditorId ? `${this.API_URL}?auditorId=${auditorId}` : this.API_URL;
    return this.http.get<any>(url);
  }

  /** Query 2: Verdict distribution (count per SanitaryVerdict) */
  getVerdictDistribution(auditorId: number): Observable<{ verdict: string; count: number }[]> {
    return this.http.get<any>(`${this.API_URL}/verdict-distribution?auditorId=${auditorId}`);
  }

  /** Query 3: Resolution status breakdown (count per ResolutionStatus) */
  getStatusBreakdown(auditorId: number): Observable<{ status: string; count: number }[]> {
    return this.http.get<any>(`${this.API_URL}/status-breakdown?auditorId=${auditorId}`);
  }

  /** Query 4: Total recycled weight grouped by destination */
  getRecyclingByDestination(auditorId: number): Observable<{ destination: string; totalWeight: number }[]> {
    return this.http.get<any>(`${this.API_URL}/recycling-by-destination?auditorId=${auditorId}`);
  }

  /** Query 5: Monthly inspection trends (count per month) */
  getMonthlyInspections(auditorId: number): Observable<{ month: string; count: number }[]> {
    return this.http.get<any>(`${this.API_URL}/monthly-inspections?auditorId=${auditorId}`);
  }

  /** Query 6: Total recycled weight for an auditor */
  getTotalRecyclingWeight(auditorId: number): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/total-weight?auditorId=${auditorId}`);
  }

  /** Query 7: Conversion rate (inspections leading to recycling) */
  getConversionRate(auditorId: number): Observable<{ rate: number; total: number; recycled: number }> {
    return this.http.get<any>(`${this.API_URL}/conversion-rate?auditorId=${auditorId}`);
  }

  /** Query 8: Cases with recycling records vs cases without */
  getCasesWithRecycling(auditorId: number): Observable<{ withRecycling: number; withoutRecycling: number }> {
    return this.http.get<any>(`${this.API_URL}/cases-with-recycling?auditorId=${auditorId}`);
  }

  /** Query 9: Average recycled weight per destination */
  getAvgWeightByDestination(auditorId: number): Observable<{ destination: string; avgWeight: number }[]> {
    return this.http.get<any>(`${this.API_URL}/avg-weight-by-destination?auditorId=${auditorId}`);
  }

  /** Query 10: Monthly recycling volume trend */
  getMonthlyRecyclingVolume(auditorId: number): Observable<{ month: string; totalWeight: number }[]> {
    return this.http.get<any>(`${this.API_URL}/monthly-recycling?auditorId=${auditorId}`);
  }
}
