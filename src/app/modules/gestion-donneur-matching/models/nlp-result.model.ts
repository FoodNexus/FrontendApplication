export interface NlpResult {
  produitDetecte: string;
  categorie: string;
  quantite: number;
  unite: string;
  datePeremption: string;
  urgence: string;
  success: boolean;
  message: string;
}

export interface NlpCreateLotRequest {
  texte: string;
  donneurId: number;
}

export interface NlpCreateLotResponse {
  lotId: number;
  produitId: number;
  message: string;
  success: boolean;
}