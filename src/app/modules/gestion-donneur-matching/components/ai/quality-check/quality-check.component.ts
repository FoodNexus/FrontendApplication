import { Component } from '@angular/core';
import { QualityService, QualityResult } from '../../../services/quality.service';

@Component({
  selector: 'app-quality-check',
  templateUrl: './quality-check.component.html',
  styleUrls: ['./quality-check.component.scss']
})
export class QualityCheckComponent {
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  result: QualityResult | null = null;
  loading = false;
  error = '';

  constructor(private qualityService: QualityService) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.result = null;
      this.error = '';
      const reader = new FileReader();
      reader.onload = (e: any) => { this.imagePreview = e.target.result; };
      reader.readAsDataURL(file);
    }
  }

  verifier(): void {
    if (!this.selectedFile) return;
    this.loading = true;
    this.error = '';
    this.result = null;

    this.qualityService.analyserQualite(this.selectedFile).subscribe({
      next: (res: QualityResult) => {
        this.result = res;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Erreur lors de l\'analyse qualité';
        this.loading = false;
      }
    });
  }
}