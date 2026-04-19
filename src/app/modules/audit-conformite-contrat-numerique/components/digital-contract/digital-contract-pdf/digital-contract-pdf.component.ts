import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DigitalContractService } from '../../../services/digital-contract.service';
import { DigitalContract } from '../../../models/digital-contract.model';

@Component({
  selector: 'app-digital-contract-pdf',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './digital-contract-pdf.component.html',
  styleUrls: ['./digital-contract-pdf.component.scss']
})
export class DigitalContractPdfComponent implements OnInit {
  contract: DigitalContract | null = null;
  loading = true;
  error = '';
  
  today = new Date().toLocaleDateString('fr-FR');

  constructor(
    private route: ActivatedRoute,
    private contractService: DigitalContractService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.contractService.getById(Number(id)).subscribe({
        next: (data) => {
          this.contract = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Impossible de charger le document PDF.';
          this.loading = false;
        }
      });
    }
  }

  printPdf(): void {
    window.print();
  }
}
