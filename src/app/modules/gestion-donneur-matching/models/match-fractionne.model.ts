import { StatutMatch } from './enums.model';

export interface MatchFractionneRequest {
  lotId: number;
  idReceveur: number;
  idPartenaireCirculaire: number | null;
  quantiteAllouee: number;
}

export interface MatchFractionneResponse {
  idMatch: number;
  lotId: number;
  idReceveur: number;
  idPartenaireCirculaire: number;
  quantiteAllouee: number;
  scoreMatching: number;
  dateMatch: string;
  statutMatch: StatutMatch;
}