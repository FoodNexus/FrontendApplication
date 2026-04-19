import { NiveauUrgence, StatutLot } from './enums.model';

export interface LotRequest {
  donneurId: number;
  niveauUrgence: NiveauUrgence;
}

export interface LotResponse {
  idLot: number;
  donneurId: number;
  dateCreation: string;
  statut: StatutLot;
  niveauUrgence: NiveauUrgence;
  nombreProduits: number;
  nombreMatchs: number;
}