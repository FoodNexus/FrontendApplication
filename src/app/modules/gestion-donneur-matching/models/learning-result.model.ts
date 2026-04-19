export interface ReceveurProfile {
  receveurId: number;
  tauxSucces: number;
  totalMatchs: number;
  totalLivres: number;
  totalRefuses: number;
  distanceMoyenneAcceptee: number;
  categoriesPreferees: string[];
  bonusMalus: number;
}

export interface LearningResult {
  receveurId: number;
  lotId: number;
  scoreBase: number;
  bonusMalus: number;
  scoreFinal: number;
}