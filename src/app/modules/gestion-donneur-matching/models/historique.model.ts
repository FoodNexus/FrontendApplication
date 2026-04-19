export interface HistoriqueRequest {
  lotId: number;
  produitId: number;
  quantite: number;
  datePeremptionExacte: string;
}

export interface HistoriqueResponse {
  idHistorique: number;
  lotId: number;
  produitId: number;
  libelleProduit: string;
  codeBarre: string;
  quantite: number;
  datePeremptionExacte: string;
}