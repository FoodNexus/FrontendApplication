/**
 * Façade métier recycler requests — analogue à `{@code Resource}` Spring sur `/api/.../recycler-requests`.
 * Persisté en local pour l’instant ; à aligner avec le contrôleleur backend.
 */

import { Injectable } from '@angular/core';

import type { RecyclerRequest, RequestStatus } from '../models/recycler-operations.model';
import {
  isNutriflowAdminCreditVerifiableStatus,
  loadRecyclerRequests,
  mergeRecyclerRequestsLocalWithRemote,
  NUTRIFLOW_KEY_DISPLAY_NAMES_STORAGE_KEY,
  RECYCLER_REQUESTS_CHANGED_EVENT,
  RECYCLER_REQUESTS_STORAGE_KEY,
  saveRecyclerRequests
} from '../storage/recycler-operations.storage';

@Injectable({ providedIn: 'root' })
export class NutriflowRecyclerRequestsService {
  static readonly STORAGE_KEY = RECYCLER_REQUESTS_STORAGE_KEY;
  static readonly CHANGED_EVENT = RECYCLER_REQUESTS_CHANGED_EVENT;
  static readonly KEY_DISPLAY_NAMES_STORAGE_KEY = NUTRIFLOW_KEY_DISPLAY_NAMES_STORAGE_KEY;

  getAll(): RecyclerRequest[] {
    return loadRecyclerRequests();
  }

  getById(id: number): RecyclerRequest | undefined {
    return loadRecyclerRequests().find((r) => r.id === id);
  }

  saveAll(requests: RecyclerRequest[]): void {
    saveRecyclerRequests(requests);
  }

  mergeWithRemote(local: RecyclerRequest[], remote: RecyclerRequest[]): RecyclerRequest[] {
    return mergeRecyclerRequestsLocalWithRemote(local, remote);
  }

  isAdminCreditVerifiable(status: RequestStatus): boolean {
    return isNutriflowAdminCreditVerifiableStatus(status);
  }
}
