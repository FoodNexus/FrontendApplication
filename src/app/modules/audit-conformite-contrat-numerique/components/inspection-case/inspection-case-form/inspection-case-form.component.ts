import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, 
         FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InspectionCaseService } 
  from '../../../services/inspection-case.service';
import { ResolutionStatus, SanitaryVerdict } 
  from '../../../models/inspection-case.model';

@Component({
  selector: 'app-inspection-case-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './inspection-case-form.component.html',
  styleUrls: ['./inspection-case-form.component.scss']
})
export class InspectionCaseFormComponent implements OnInit {

  form!: FormGroup;
  isEdit = false;
  caseId!: number;
  loading = false;
  errorMessage = '';

  sanitaryVerdicts = Object.values(SanitaryVerdict);
  resolutionStatuses = Object.values(ResolutionStatus);

  constructor(
    private fb: FormBuilder,
    private service: InspectionCaseService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      description:      ['', Validators.required],
      sanitaryVerdict:  ['', Validators.required],
      resolutionStatus: [''],
      deliveryId:       ['', [Validators.required, Validators.min(1)]],
      auditorId:        ['', [Validators.required, Validators.min(1)]]
    });

    // Mode Edit
    this.caseId = this.route.snapshot.params['id'];
    if (this.caseId) {
      this.isEdit = true;
      this.service.getById(this.caseId).subscribe({
        next: (data) => this.form.patchValue(data),
        error: () => this.errorMessage = 'Erreur de chargement'
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const data = this.form.value;

    if (this.isEdit) {
      this.service.update(this.caseId, data).subscribe({
        next: () => this.router.navigate(['../inspection-cases']),
        error: () => {
          this.errorMessage = 'Erreur de modification';
          this.loading = false;
        }
      });
    } else {
      this.service.create(data).subscribe({
        next: () => this.router.navigate(['../inspection-cases']),
        error: () => {
          this.errorMessage = 'Erreur de création';
          this.loading = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['../inspection-cases']);
  }
}