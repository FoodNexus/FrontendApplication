import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder,
         FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DigitalContractService }
  from '../../../services/digital-contract.service';
import { ContractStatus } from '../../../models/digital-contract.model';

@Component({
  selector: 'app-digital-contract-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './digital-contract-form.component.html',
  styleUrls: ['./digital-contract-form.component.scss']
})
export class DigitalContractFormComponent implements OnInit {

  form!: FormGroup;
  isEdit = false;
  contractId!: number;
  loading = false;
  errorMessage = '';

  contractStatuses = Object.values(ContractStatus);

  statusLabels: Record<string, string> = {
    'GENERE': 'Généré',
    'ENVOYE': 'Envoyé',
    'ARCHIVE': 'Archivé'
  };

  constructor(
    private fb: FormBuilder,
    private service: DigitalContractService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      fiscalDeductionValue: ['', [Validators.required, Validators.min(0)]],
      donorName:   ['', Validators.required],
      receiverName: ['', Validators.required],
      delevry_to:  ['', Validators.required],
      status:      [null]
    });

    this.contractId = this.route.snapshot.params['id'];
    if (this.contractId) {
      this.isEdit = true;
      this.service.getById(this.contractId).subscribe({
        next: (data) => this.form.patchValue(data),
        error: () => this.errorMessage = 'Impossible de charger le contrat.'
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = '';

    const data = this.form.value;

    if (this.isEdit) {
      this.service.update(this.contractId, data).subscribe({
        next: () => this.router.navigate(['/audit/contracts']),
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erreur lors de la modification.';
          this.loading = false;
        }
      });
    } else {
      this.service.create(data).subscribe({
        next: () => this.router.navigate(['/audit/contracts']),
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erreur lors de la création.';
          this.loading = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/audit/contracts']);
  }
}