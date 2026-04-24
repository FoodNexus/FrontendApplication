import { DestroyRef, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DONOR_LOTS_MUTATED_EVENT,
  DONOR_LOTS_STORAGE_KEY,
  loadAllDonorLots
} from '../storage/donor-lots.storage';
import {
  loadRecyclerRequests,
  mergeRecyclerRequestsLocalWithRemote,
  RECYCLER_REQUESTS_CHANGED_EVENT,
  RECYCLER_REQUESTS_STORAGE_KEY,
  RecyclerRequest,
  saveRecyclerRequests
} from '../storage/recycler-operations.storage';
import { NUTRIFLOW_CREDITS_MUTATED_EVENT, NUTRIFLOW_CREDITS_STORAGE_KEY } from './recycler-credits.service';

/** Après un pull réussi depuis le hub (même onglet). Les vues doivent recharger depuis localStorage. */
export const NUTRIFLOW_HUB_PULLED_EVENT = 'nutriflow-hub-pulled';

@Injectable({ providedIn: 'root' })
export class NutriflowHubSyncService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private pushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const base = environment.nutriflowHubBaseUrl?.trim();
    if (!base) {
      return;
    }
    this.start(base);
  }

  isEnabled(): boolean {
    return !!environment.nutriflowHubBaseUrl?.trim();
  }

  /** Pull manuel (ex. après navigation). */
  pullNow(): Observable<void> {
    const base = environment.nutriflowHubBaseUrl?.trim();
    if (!base) {
      return of(void 0);
    }
    return this.pull(base);
  }

  private start(base: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    const schedulePush = (): void => {
      if (this.pushTimer != null) {
        clearTimeout(this.pushTimer);
      }
      this.pushTimer = setTimeout(() => {
        this.pushTimer = null;
        this.push(base).subscribe();
      }, 450);
    };

    window.addEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, schedulePush);
    window.addEventListener(DONOR_LOTS_MUTATED_EVENT, schedulePush);
    window.addEventListener(NUTRIFLOW_CREDITS_MUTATED_EVENT, schedulePush);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, schedulePush);
      window.removeEventListener(DONOR_LOTS_MUTATED_EVENT, schedulePush);
      window.removeEventListener(NUTRIFLOW_CREDITS_MUTATED_EVENT, schedulePush);
      if (this.pushTimer != null) {
        clearTimeout(this.pushTimer);
      }
    });

    interval(6000)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.pull(base))
      )
      .subscribe();

    this.pull(base).subscribe();
  }

  private pull(base: string): Observable<void> {
    return forkJoin({
      lots: this.http.get(`${base}/api/nutriflow/donor-lots`, { responseType: 'text' }).pipe(catchError(() => of(null))),
      req: this.http
        .get(`${base}/api/nutriflow/recycler-requests`, { responseType: 'text' })
        .pipe(catchError(() => of(null))),
      cred: this.http
        .get(`${base}/api/nutriflow/recycler-credits`, { responseType: 'text' })
        .pipe(catchError(() => of(null)))
    }).pipe(
      switchMap((data) => {
        if (this.isServerDatasetEmpty(data) && this.localHasNutriflowData()) {
          return this.push(base);
        }
        this.applyServerToLocal(data);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(NUTRIFLOW_HUB_PULLED_EVENT));
        }
        return of(void 0);
      }),
      catchError(() => of(void 0))
    );
  }

  private push(base: string): Observable<void> {
    const lots = localStorage.getItem(DONOR_LOTS_STORAGE_KEY) ?? '[]';
    const req = localStorage.getItem(RECYCLER_REQUESTS_STORAGE_KEY) ?? '[]';
    const cred = localStorage.getItem(NUTRIFLOW_CREDITS_STORAGE_KEY) ?? '{"ledger":[]}';
    const headers = { 'Content-Type': 'application/json' };
    return forkJoin([
      this.http.put(`${base}/api/nutriflow/donor-lots`, lots, { headers }).pipe(catchError(() => of(null))),
      this.http.put(`${base}/api/nutriflow/recycler-requests`, req, { headers }).pipe(catchError(() => of(null))),
      this.http.put(`${base}/api/nutriflow/recycler-credits`, cred, { headers }).pipe(catchError(() => of(null)))
    ]).pipe(map(() => void 0));
  }

  private isServerDatasetEmpty(data: { lots: string | null; req: string | null; cred: string | null }): boolean {
    const lotsEmpty = !data.lots || data.lots.trim() === '[]';
    const reqEmpty = !data.req || data.req.trim() === '[]';
    let credEmpty = !data.cred || data.cred.trim() === '' || data.cred.trim() === '{"ledger":[]}';
    if (data.cred) {
      try {
        const p = JSON.parse(data.cred) as { ledger?: unknown[] };
        credEmpty = !Array.isArray(p.ledger) || p.ledger.length === 0;
      } catch {
        credEmpty = false;
      }
    }
    return lotsEmpty && reqEmpty && credEmpty;
  }

  private localHasNutriflowData(): boolean {
    const lots = localStorage.getItem(DONOR_LOTS_STORAGE_KEY);
    const req = localStorage.getItem(RECYCLER_REQUESTS_STORAGE_KEY);
    const cred = localStorage.getItem(NUTRIFLOW_CREDITS_STORAGE_KEY);
    const lotsHas = lots != null && lots.trim() !== '' && lots.trim() !== '[]';
    const reqHas = req != null && req.trim() !== '' && req.trim() !== '[]';
    let credHas = false;
    if (cred) {
      try {
        const p = JSON.parse(cred) as { ledger?: unknown[] };
        credHas = Array.isArray(p.ledger) && p.ledger.length > 0;
      } catch {
        credHas = true;
      }
    }
    return lotsHas || reqHas || credHas;
  }

  private applyServerToLocal(data: { lots: string | null; req: string | null; cred: string | null }): void {
    if (data.lots != null && data.lots.trim() !== '') {
      try {
        const parsed = JSON.parse(data.lots) as unknown;
        if (!Array.isArray(parsed)) {
          return;
        }
        if (parsed.length === 0) {
          const localLots = loadAllDonorLots();
          if (localLots.length > 0) {
            // Ne pas écraser des lots donateurs locaux avec un tableau vide du hub.
          } else {
            localStorage.setItem(DONOR_LOTS_STORAGE_KEY, data.lots);
          }
        } else {
          localStorage.setItem(DONOR_LOTS_STORAGE_KEY, data.lots);
        }
      } catch {
        /* ignore */
      }
    }
    if (data.req != null && data.req.trim() !== '') {
      this.applyRecyclerRequestsFromServer(data.req);
    }
    if (data.cred != null && data.cred.trim() !== '') {
      localStorage.setItem(NUTRIFLOW_CREDITS_STORAGE_KEY, data.cred);
    }
  }

  private applyRecyclerRequestsFromServer(serverRaw: string): void {
    type Ser = Omit<RecyclerRequest, 'requestedAt'> & { requestedAt: string };
    let remote: RecyclerRequest[] = [];
    try {
      const parsed = JSON.parse(serverRaw) as Ser[];
      if (!Array.isArray(parsed)) {
        return;
      }
      remote = parsed.map((entry) => ({
        ...entry,
        requestedAt: new Date(entry.requestedAt)
      }));
    } catch {
      return;
    }
    const local = loadRecyclerRequests();
    const merged = mergeRecyclerRequestsLocalWithRemote(local, remote);
    saveRecyclerRequests(merged);
  }
}
