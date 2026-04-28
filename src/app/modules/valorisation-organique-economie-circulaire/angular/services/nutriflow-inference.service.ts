import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import type { NutriflowClassificationResult } from '../models/nutriflow-inference.model';

export type { NutriflowClassificationResult } from '../models/nutriflow-inference.model';

@Injectable({ providedIn: 'root' })
export class NutriflowInferenceService {
  private readonly base = (
    environment.nutriflowInferenceUrl ?? ''
  ).replace(/\/$/, '');

  constructor(private readonly http: HttpClient) {}

  classifyImage(file: File): Observable<NutriflowClassificationResult> {
    if (!this.base) {
      return throwError(
        () => new Error("environment.nutriflowInferenceUrl n'est pas défini")
      );
    }
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.http.post<NutriflowClassificationResult>(
      `${this.base}/api/nutriflow/classify-image`,
      fd
    );
  }

  health(): Observable<{ status: string; model: string }> {
    if (!this.base) {
      return throwError(
        () => new Error("environment.nutriflowInferenceUrl n'est pas défini")
      );
    }
    return this.http.get<{ status: string; model: string }>(`${this.base}/health`);
  }
}
