/** Lots valorisation NutriFlow publiés par les donateurs. */

export type DonorLotListingStatus = 'listed' | 'paused';

export interface DonorLotRecord {
  id: number;
  donorUserKey: string;
  matchingLotId?: number;
  name: string;
  category: string;
  quantityKg: number;
  location: string;
  imageUrl?: string;
  listingStatus: DonorLotListingStatus;
  classificationDescription?: string;
  classificationFilieres?: string[];
  aiRecyclablePercent?: number;
  aiOrganicPercent?: number;
}
