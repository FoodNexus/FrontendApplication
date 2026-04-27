export interface DigitalContract {
  contractId?: number;
  generationDate?: string;
  pdfDocumentUrl?: string;
  fiscalDeductionValue: number;
  delevry_to: string;
  donorName: string;
  receiverName: string;
  status?: ContractStatus;
}

export enum ContractStatus {
  GENERE = 'GENERE',
  ENVOYE = 'ENVOYE',
  ARCHIVE = 'ARCHIVE'
}
