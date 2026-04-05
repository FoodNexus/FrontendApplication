import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, 
         FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RecyclingProductsService } 
  from '../../../services/recycling-products.service';
import { Destination } from '../../../models/recycling-products.model';

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
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      caseId:      [''],
      weight:      ['', [Validators.required, Validators.min(0.1)]],
      destination: ['', Validators.required]
    });

    this.productId = this.route.snapshot.params['id'];
    if (this.productId) {
      this.isEdit = true;
      this.service.getById(this.productId).subscribe({
        next: (data) => this.form.patchValue(data),
        error: () => this.errorMessage = 'Erreur de chargement'
      });
    } else {
      this.form.get('caseId')?.setValidators(Validators.required);
      this.form.get('caseId')?.updateValueAndValidity();
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
      this.service.create(data.caseId, data).subscribe({
        next: () => this.router.navigate(['/audit/recycling-products']),
        error: () => {
          this.errorMessage = 'Erreur de création';
          this.loading = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/audit/recycling-products']);
  }
}