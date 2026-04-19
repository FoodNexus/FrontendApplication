import { Component } from '@angular/core';
import { OcrService, OcrResult, OcrCreateLotResponse } from '../../../services/ocr.service';

@Component({
  selector: 'app-ocr-scan',
  templateUrl: './ocr-scan.component.html',
  styleUrls: ['./ocr-scan.component.scss']
})
export class OcrScanComponent {
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  result: OcrResult | null = null;
  lotCree: OcrCreateLotResponse | null = null;
  loading = false;
  loadingCreation = false;
  error = '';

  constructor(private ocrService: OcrService) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.result = null;
      this.lotCree = null;
      this.error = '';
      const reader = new FileReader();
      reader.onload = (e: any) => { this.imagePreview = e.target.result; };
      reader.readAsDataURL(file);
    }
  }

  scanner(): void {
    if (!this.selectedFile) return;
    this.loading = true;
    this.error = '';
    this.result = null;

    this.ocrService.scanImage(this.selectedFile).subscribe({
      next: (res: OcrResult) => {
        this.result = res;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Erreur lors du scan OCR';
        this.loading = false;
      }
    });
  }

  creerLot(): void {
    if (!this.selectedFile) return;
    this.loadingCreation = true;

    // ✅ Envoie le fichier + donneurId (le backend re-scanne l'image)
    this.ocrService.creerLotDepuisScan(this.selectedFile, 1, 1).subscribe({
      next: (res: OcrCreateLotResponse) => {
        this.lotCree = res;
        this.loadingCreation = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Erreur lors de la création du lot';
        this.loadingCreation = false;
      }
    });
  }
}