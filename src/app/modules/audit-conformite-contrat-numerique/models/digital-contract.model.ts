export interface DigitalContract {
  contractId?: number;
  generationDate?: string;
  pdfDocumentUrl?: string;
  fiscalDeductionValue: number;
  deliveryId: number;
  donorName: string;
  receiverName: string;
  status?: ContractStatus;
}

export enum ContractStatus {
  GENERE = 'GENERE',
  ENVOYE = 'ENVOYE',
  ARCHIVE = 'ARCHIVE'
}
