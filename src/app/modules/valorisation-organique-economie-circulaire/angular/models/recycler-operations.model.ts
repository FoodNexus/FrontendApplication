/**
 * Types NutriFlow — demandes recycleur et produits recyclables (alignés au stockage local).
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
  donorLotId?: number;
  donorUserKey?: string;
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
  donorUserKey?: string;
  donorLotId?: number;
  lotCode?: string;
  treatmentPlan?: string;
  pickupWindow?: string;
  managerComment?: string;
  recyclerUserKey?: string;
  verificationSubmittedAt?: string;
  adminVerificationComment?: string;
  verifiedAt?: string;
}
