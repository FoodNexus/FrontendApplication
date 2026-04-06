export interface OcrResult {
  codeBarre: string;
  produitDetecte: string;
  datePeremption: string;
  texteBrut: string;
  success: boolean;
  message: string;
}

export interface OcrCreateLotRequest {
  codeBarre: string;
  datePeremption: string;
  donneurId: number;
  quantite: number;
  unite: string;
}

export interface OcrCreateLotResponse {
  lotId: number;
  produitId: number;
  message: string;
  success: boolean;
}