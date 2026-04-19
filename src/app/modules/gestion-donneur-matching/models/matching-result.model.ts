import { StatutLot } from './enums.model';
import { MatchFractionneResponse } from './match-fractionne.model';

export interface AllocationResult {
  receveurId: number;
  receveurNom: string;
  quantiteAllouee: number;
  scoreFinal: number;
  scoreDistance: number;
  scoreUrgence: number;
  scorePeremption: number;
  scoreCapacite: number;
  scoreCategorie: number;
  distanceKm: number;
}

export interface ReceveurSimule {
  id: number;
  nom: string;
  latitude: number;
  longitude: number;
  capaciteMax: number;
  categoriesAcceptees: string[];
}

export interface MatchingResultDTO {
  lotId: number;
  quantiteTotale: number;
  quantiteDistribuee: number;
  quantiteRestante: number;
  nombreMatchs: number;
  nouveauStatutLot: StatutLot;
  dateMatching: string;
  allocations: AllocationResult[];
  matchsCrees: MatchFractionneResponse[];
}