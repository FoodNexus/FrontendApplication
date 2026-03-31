export interface DigitalContract {
  contractId?: number;
  generationDate?: string;
  pdfDocumentUrl?: string;
  fiscalDeductionValue: number;
  deliveryId: number;
  donorId: number;
  receiverId: number;
  status?: ContractStatus;
}

export enum ContractStatus {
  GENERE = 'GENERE',
  ENVOYE = 'ENVOYE',
  ARCHIVE = 'ARCHIVE'
}
