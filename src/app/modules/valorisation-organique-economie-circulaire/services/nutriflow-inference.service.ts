import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

/** Aligné sur `ai-model/schema/classification-output.schema.json` (champs utilisés par l’API ONNX). */
export interface NutriflowClassificationResult {
  schemaVersion: string;
  sourceTextHash: string;
  categories: { label: string; score: number }[];
  filieres: { code: string; score: number; notes?: string }[];
  confidence: number;
  flags?: string[];
  modelVersion?: string;
}

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
