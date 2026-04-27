import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InspectionCaseService } from '../../../services/inspection-case.service';
import { AuthService } from '../../../../gestion-user/services/auth.service';
import { SanitaryVerdict, ResolutionStatus } from '../../../models/inspection-case.model';

@Component({
  selector: 'app-ai-scanner',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './ai.component.html',
  styleUrls: ['./ai.component.scss']
})
export class AiScannerComponent {

  form: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  
  isAnalyzing = false;
  analysisDone = false;
  verdict: SanitaryVerdict | null = null;
  
  showModal = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  verdictLabels: Record<string, string> = {
    'PROPRE_A_LA_CONSOMMATION': 'Propre à la consommation',
    'DESTRUCTION_RECYCLAGE': 'Destruction / Recyclage'
  };

  constructor(
    private fb: FormBuilder,
    private service: InspectionCaseService,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      description: ['', Validators.required],
      delevry_to: ['', Validators.required]
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
      this.analysisDone = false;
      this.verdict = null;
    }
  }

  analyze(): void {
    if (!this.selectedFile) return;

    this.isAnalyzing = true;
    this.errorMessage = '';
    
    this.service.analyze(this.selectedFile).subscribe({
      next: (res) => {
        this.verdict = res.sanitaryVerdict;
        this.isAnalyzing = false;
        this.analysisDone = true;
        // Show the modal after a short delay for effect
        setTimeout(() => this.showModal = true, 800);
      },
      error: () => {
        this.errorMessage = "Erreur lors de l'analyse AI.";
        this.isAnalyzing = false;
      }
    });
  }

  save(): void {
    if (this.form.invalid || !this.verdict) return;

    this.isSaving = true;
    const currentUser = this.authService.getCurrentUser();
    
    const inspectionData = {
      description: this.form.value.description,
      delevry_to: this.form.value.delevry_to,
      sanitaryVerdict: this.verdict,
      auditorId: currentUser?.idUser || 0,
      resolutionStatus: ResolutionStatus.EN_COURS
    };

    this.service.create(inspectionData).subscribe({
      next: () => {
        this.successMessage = 'Inspection enregistrée avec succès !';
        this.showModal = false;
        setTimeout(() => this.router.navigate(['/audit/inspection-cases']), 1500);
      },
      error: () => {
        this.errorMessage = "Erreur lors de l'enregistrement.";
        this.isSaving = false;
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
  }
}
