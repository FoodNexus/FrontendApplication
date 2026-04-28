export enum Destination {
  COMPOST = 'COMPOST',
  AGRICULTEUR = 'AGRICULTEUR'
}

export interface RecyclingProducts {
  logId?: number;
  weight: number;
  destination: Destination;
  logDate?: string;
  transferDate?: string;
  inspectionCase?: {
    caseId?: number;
    description?: string;
    auditorId?: number;
    sanitaryVerdict?: string;
    delevry_to?: string;
  };
}
