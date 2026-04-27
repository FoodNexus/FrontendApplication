import { CategorieProduit } from './enums.model';

export interface ProduitRequest {
  codeBarre: string;
  libelle: string;
  categorie: CategorieProduit;
  poidsUnitaire: number;
}

export interface ProduitResponse {
  idProduit: number;
  codeBarre: string;
  libelle: string;
  categorie: CategorieProduit;
  poidsUnitaire: number;
}