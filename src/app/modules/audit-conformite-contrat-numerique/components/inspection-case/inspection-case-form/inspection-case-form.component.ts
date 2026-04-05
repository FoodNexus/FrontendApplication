import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder,
         FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InspectionCaseService }
  from '../../../services/inspection-case.service';
import { AuthService }
  from '../../../../gestion-user/services/auth.service';
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
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Seulement description + verdict + status
    // auditorId et deliveryId seront récupérés automatiquement côté backend
    this.form = this.fb.group({
      description:      ['', Validators.required],
      sanitaryVerdict:  ['', Validators.required],
      resolutionStatus: ['']
    });

    this.caseId = this.route.snapshot.params['id'];
    if (this.caseId) {
      this.isEdit = true;
      this.service.getById(this.caseId).subscribe({
        next: (data) => this.form.patchValue(data),
        error: () => this.errorMessage = 'Erreur de chargement'
      });
    }

    // Ensure we have the DB ID for the auditor
    if (!this.authService.getCurrentUser() && this.authService.isLoggedIn()) {
      this.authService.fetchUserProfile().subscribe();
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const currentUser = this.authService.getCurrentUser();
    const data = {
      ...this.form.value,
      auditorId: currentUser?.idUser,
      deliveryId: null // Laisser vide selon la requête
    };

    if (this.isEdit) {
      this.service.update(this.caseId, data).subscribe({
        next: () => this.router.navigate(['/audit/inspection-cases']),
        error: () => {
          this.errorMessage = 'Erreur de modification';
          this.loading = false;
        }
      });
    } else {
      this.service.create(data).subscribe({
        next: () => this.router.navigate(['/audit/inspection-cases']),
        error: () => {
          this.errorMessage = 'Erreur de création';
          this.loading = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/audit/inspection-cases']);
  }
}