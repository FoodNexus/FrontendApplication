/**
 * Lots valorisation / NutriFlow publiés par les donateurs (localStorage).
 * Les recycleurs voient ces lots dans la liste des produits disponibles.
 */

export type { DonorLotRecord } from '../models/donor-lots.model';

import type { DonorLotRecord } from '../models/donor-lots.model';

export const DONOR_LOTS_STORAGE_KEY = 'nutriflow-donor-lots';

export const DONOR_LOTS_MUTATED_EVENT = 'nutriflow-donor-lots-mutated';

/** Préfixe d’ID pour éviter les collisions avec le catalogue admin dans l’UI recycleur. */
export const DONOR_LOT_PRODUCT_ID_BASE = 5_000_000;

function normalizeDonorLotRecord(raw: DonorLotRecord): DonorLotRecord {
  const listingStatus: DonorLotRecord['listingStatus'] =
    raw.listingStatus === 'paused' ? 'paused' : 'listed';
  return {
    ...raw,
    listingStatus,
    quantityKg: Math.max(0, Number(raw.quantityKg) || 0),
    donorUserKey: raw.donorUserKey ?? '',
    name: raw.name ?? '',
    category: raw.category ?? '',
    location: raw.location ?? '',
    classificationDescription: raw.classificationDescription,
    classificationFilieres: raw.classificationFilieres,
    aiRecyclablePercent:
      raw.aiRecyclablePercent != null ? Math.max(0, Math.min(100, Number(raw.aiRecyclablePercent))) : undefined,
    aiOrganicPercent:
      raw.aiOrganicPercent != null ? Math.max(0, Math.min(100, Number(raw.aiOrganicPercent))) : undefined
  };
}

export function loadAllDonorLots(): DonorLotRecord[] {
  const raw = localStorage.getItem(DONOR_LOTS_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as DonorLotRecord[];
    return Array.isArray(parsed) ? parsed.map((x) => normalizeDonorLotRecord(x)) : [];
  } catch {
    localStorage.removeItem(DONOR_LOTS_STORAGE_KEY);
    return [];
  }
}

export function saveAllDonorLots(lots: DonorLotRecord[]): void {
  localStorage.setItem(DONOR_LOTS_STORAGE_KEY, JSON.stringify(lots));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DONOR_LOTS_MUTATED_EVENT));
  }
}

export function loadLotsForDonor(donorUserKey: string): DonorLotRecord[] {
  return loadAllDonorLots().filter((l) => l.donorUserKey === donorUserKey);
}

/** Même donateur sous plusieurs clés (ex. sub Keycloak vs id base). */
export function loadLotsForDonorKeys(donorUserKeys: string[]): DonorLotRecord[] {
  const set = new Set(donorUserKeys.filter((k) => k && k.length > 0));
  if (set.size === 0) {
    return [];
  }
  return loadAllDonorLots().filter((l) => set.has(l.donorUserKey));
}

/** Lots visibles pour les recycleurs (tous donateurs). */
export function loadListedDonorLotsForRecycler(): DonorLotRecord[] {
  return loadAllDonorLots().filter((l) => l.listingStatus === 'listed' && l.quantityKg > 0);
}

export function nextDonorLotId(): number {
  const lots = loadAllDonorLots();
  if (lots.length === 0) {
    return 1;
  }
  return Math.max(...lots.map((l) => l.id)) + 1;
}
