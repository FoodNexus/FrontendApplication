/**
 * Shared persistence for recycler requests (recycler UI + admin verification).
 * Replace with API calls when the backend exposes these endpoints.
 */

export type ProductStatus = 'available' | 'approved' | 'done';

export type RequestStatus =
  | 'awaiting_donor'
  | 'pending'
  | 'approved'
  | 'available'
  | 'done'
  | 'rejected'
  | 'pending_verification'
  | 'verified'
  | 'verification_rejected';

export interface RecyclableProduct {
  id: number;
  name: string;
  category: string;
  availableKg: number;
  location: string;
  status: ProductStatus;
  imageUrl: string;
  /** Lot publié par un donateur (voir donor-lots.storage). */
  donorLotId?: number;
  donorUserKey?: string;
  /** Analyse image du donateur (affichage recycleur). */
  donorAiRecyclablePercent?: number;
  donorAiOrganicPercent?: number;
  donorAiFilieres?: string[];
  donorAiDescription?: string;
}

export interface RecyclerRequest {
  id: number;
  productId: number;
  productName: string;
  quantityKg: number;
  note: string;
  status: RequestStatus;
  requestedAt: Date;
  /** Donateur qui doit valider la demande (lots donateur). */
  donorUserKey?: string;
  donorLotId?: number;
  lotCode?: string;
  treatmentPlan?: string;
  pickupWindow?: string;
  managerComment?: string;
  /** Stable key for the recycler (idUser or Keycloak sub). */
  recyclerUserKey?: string;
  verificationSubmittedAt?: string;
  adminVerificationComment?: string;
  verifiedAt?: string;
}

export const RECYCLER_REQUESTS_STORAGE_KEY = 'gestion-receveur-requests';

/** Même onglet / même document (l’événement <code>storage</code> ne se déclenche pas en interne). */
export const RECYCLER_REQUESTS_CHANGED_EVENT = 'nutriflow-recycler-requests-changed';

type SerializedRequest = Omit<RecyclerRequest, 'requestedAt'> & { requestedAt: string };

export function loadRecyclerRequests(): RecyclerRequest[] {
  const cached = localStorage.getItem(RECYCLER_REQUESTS_STORAGE_KEY);
  if (!cached) {
    return [];
  }
  try {
    const parsed = JSON.parse(cached) as SerializedRequest[];
    return parsed.map((entry) => ({
      ...entry,
      requestedAt: new Date(entry.requestedAt)
    }));
  } catch {
    localStorage.removeItem(RECYCLER_REQUESTS_STORAGE_KEY);
    return [];
  }
}

export function saveRecyclerRequests(requests: RecyclerRequest[]): void {
  const serialized = requests.map((entry) => ({
    ...entry,
    requestedAt: entry.requestedAt.toISOString()
  }));
  localStorage.setItem(RECYCLER_REQUESTS_STORAGE_KEY, JSON.stringify(serialized));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(RECYCLER_REQUESTS_CHANGED_EVENT));
  }
}

/** Avancement métier (plus grand = plus loin dans le flux NutriFlow). */
function requestProgressRank(status: RequestStatus): number {
  switch (status) {
    case 'awaiting_donor':
      return 10;
    case 'rejected':
      return 15;
    case 'pending':
      return 20;
    case 'approved':
      return 30;
    case 'available':
      return 40;
    case 'pending_verification':
      return 50;
    case 'verification_rejected':
      return 55;
    case 'verified':
      return 60;
    case 'done':
      return 60;
    default:
      return 0;
  }
}

/**
 * Fusionne local + copie distante (hub) sans perdre la version la plus avancée.
 * Évite qu’un GET `[]` ou un snapshot ancien écrase un `pending_verification` fraîchement enregistré.
 */
export function mergeRecyclerRequestsLocalWithRemote(
  local: RecyclerRequest[],
  remote: RecyclerRequest[]
): RecyclerRequest[] {
  const byId = new Map<number, RecyclerRequest>();
  const mergeTwo = (a: RecyclerRequest, b: RecyclerRequest): RecyclerRequest => {
    const ra = requestProgressRank(a.status);
    const rb = requestProgressRank(b.status);
    if (ra !== rb) {
      return ra > rb ? a : b;
    }
    return a.requestedAt.getTime() >= b.requestedAt.getTime() ? a : b;
  };
  for (const r of remote) {
    const cur = byId.get(r.id);
    byId.set(r.id, cur ? mergeTwo(cur, r) : r);
  }
  for (const r of local) {
    const cur = byId.get(r.id);
    byId.set(r.id, cur ? mergeTwo(cur, r) : r);
  }
  return [...byId.values()].sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
}
