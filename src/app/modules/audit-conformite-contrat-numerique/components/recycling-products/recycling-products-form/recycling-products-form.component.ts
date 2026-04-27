import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, 
         FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RecyclingProductsService } 
  from '../../../services/recycling-products.service';
import { InspectionCaseService } 
  from '../../../services/inspection-case.service';
import { AuthService }
  from '../../../../gestion-user/services/auth.service';
import { Destination } from '../../../models/recycling-products.model';
import { InspectionCase, SanitaryVerdict } from '../../../models/inspection-case.model';

@Component({
  selector: 'app-recycling-products-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './recycling-products-form.component.html',
  styleUrls: ['./recycling-products-form.component.scss']
})
export class RecyclingProductsFormComponent implements OnInit {

  form!: FormGroup;
  productId!: number;
  isEdit = false;
  loading = false;
  errorMessage = '';
  destinations = Object.values(Destination);

  constructor(
    private fb: FormBuilder,
    private service: RecyclingProductsService,
    private inspectionService: InspectionCaseService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Only fetch user profile if creating and not loaded
    if (!this.productId && !this.authService.getCurrentUser()) {
       this.authService.fetchUserProfile().subscribe();
    }

    this.form = this.fb.group({
      description: [null],
      delevry_to:  [''],
      weight:      [null, [Validators.required, Validators.min(0.1)]],
      destination: [null, Validators.required]
    });

    this.productId = this.route.snapshot.params['id'];
    if (this.productId) {
      this.isEdit = true;
      this.service.getById(this.productId).subscribe({
        next: (data) => this.form.patchValue(data),
        error: () => this.errorMessage = 'Erreur de chargement'
      });
    } else {
      // Pour la création, description et delevry_to sont obligatoires pour générer le dossier parent
      this.form.get('description')?.setValidators(Validators.required);
      this.form.get('delevry_to')?.setValidators(Validators.required);
      this.form.get('description')?.updateValueAndValidity();
      this.form.get('delevry_to')?.updateValueAndValidity();
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const data = this.form.value;

    if (this.isEdit) {
      this.service.updateDetails(this.productId, data.weight, data.destination).subscribe({
        next: () => this.router.navigate(['/audit/recycling-products']),
        error: () => {
          this.errorMessage = 'Erreur de mise à jour';
          this.loading = false;
        }
      });
    } else {
      // 1. Créer le dossier d'inspection d'abord
      const currentUser = this.authService.getCurrentUser();
      const inspectionData: any = {
        description: data.description,
        sanitaryVerdict: SanitaryVerdict.DESTRUCTION_RECYCLAGE,
        delevry_to: data.delevry_to,
        auditorId: currentUser?.idUser
      };

      this.inspectionService.create(inspectionData).subscribe({
        next: (createdCase) => {
          // 2. Lier le produit recyclé au nouveau dossier d'inspection
          const recycleData = {
            weight: data.weight,
            destination: data.destination
          };
          this.service.create(createdCase.caseId!, recycleData).subscribe({
            next: () => this.router.navigate(['/audit/recycling-products']),
            error: () => {
              this.errorMessage = 'Erreur lors de la création du produit recyclé';
              this.loading = false;
            }
          });
        },
        error: () => {
          this.errorMessage = 'Erreur lors de la création du dossier d\'inspection';
          this.loading = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/audit/recycling-products']);
  }
}