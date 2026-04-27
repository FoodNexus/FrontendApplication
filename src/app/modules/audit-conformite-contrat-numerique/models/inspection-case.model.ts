export interface InspectionCase {
  caseId?: number;
  creationDate?: string;
  description: string;
  resolutionStatus?: ResolutionStatus;
  sanitaryVerdict?: SanitaryVerdict;
  delevry_to: string;
  auditorId: number;
}

export enum ResolutionStatus {
  EN_COURS = 'EN_COURS',
  RESOLU = 'RESOLU',
  FERME = 'FERME'
}

export enum SanitaryVerdict {
  PROPRE_A_LA_CONSOMMATION = 'PROPRE_A_LA_CONSOMMATION',
  DESTRUCTION_RECYCLAGE = 'DESTRUCTION_RECYCLAGE'
}