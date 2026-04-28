/**
 * Façade domaine NutriFlow — même surface que `{@code RestController}+/api/lots` côté Spring.
 * À terme : remplacer par des {@link HttpClient} vers le même contrat REST.
 */

import { Injectable } from '@angular/core';

import type { DonorLotRecord } from '../models/donor-lots.model';

import {
  DONOR_LOT_PRODUCT_ID_BASE,
  DONOR_LOTS_MUTATED_EVENT,
  DONOR_LOTS_STORAGE_KEY,
  loadAllDonorLots,
  loadListedDonorLotsForRecycler,
  loadLotsForDonorKeys,
  nextDonorLotId,
  saveAllDonorLots
} from '../storage/donor-lots.storage';

@Injectable({ providedIn: 'root' })
export class DonorLotsService {
  static readonly STORAGE_KEY = DONOR_LOTS_STORAGE_KEY;
  static readonly MUTATED_EVENT = DONOR_LOTS_MUTATED_EVENT;
  static readonly DONOR_LOT_PRODUCT_ID_BASE = DONOR_LOT_PRODUCT_ID_BASE;

  /** Liste — GET /lots */
  getAll(): DonorLotRecord[] {
    return loadAllDonorLots();
  }

  /** Détail — GET /lots/{id} */
  getById(id: number): DonorLotRecord | undefined {
    return loadAllDonorLots().find((l) => l.id === id);
  }

  /** Remplacer la liste (upsert synchro locale / hub). */
  saveAll(lots: DonorLotRecord[]): void {
    saveAllDonorLots(lots);
  }

  findForDonorKeys(donorUserKeys: string[]): DonorLotRecord[] {
    return loadLotsForDonorKeys(donorUserKeys);
  }

  findListedForRecycler(): DonorLotRecord[] {
    return loadListedDonorLotsForRecycler();
  }

  allocateNextId(): number {
    return nextDonorLotId();
  }

  delete(id: number): boolean {
    const all = loadAllDonorLots();
    const next = all.filter((l) => l.id !== id);
    if (next.length === all.length) {
      return false;
    }
    saveAllDonorLots(next);
    return true;
  }
}
