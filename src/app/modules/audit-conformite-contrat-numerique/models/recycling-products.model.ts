import { InspectionCase } from './inspection-case.model';

export interface RecyclingProducts {
  logId?: number;
  transferDate?: string;
  weight?: number;
  destination?: Destination;
  inspectionCase?: InspectionCase;
}

export enum Destination {
  COMPOST = 'COMPOST',
  AGRICULTEUR = 'AGRICULTEUR'
}