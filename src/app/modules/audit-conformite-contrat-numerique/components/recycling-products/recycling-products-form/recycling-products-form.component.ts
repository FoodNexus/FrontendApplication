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
      weight:      ['', [Validators.required, Validators.min(0.1)]],
      destination: ['', Validators.required]
    });

    this.productId = this.route.snapshot.params['id'];
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const { weight, destination } = this.form.value;

    this.service.updateDetails(this.productId, weight, destination).subscribe({
      next: () => this.router.navigate(['../recycling-products']),
      error: () => {
        this.errorMessage = 'Erreur de mise à jour';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['../recycling-products']);
  }
}