import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DigitalContractService } from '../../../services/digital-contract.service';
import { DigitalContract } from '../../../models/digital-contract.model';

@Component({
  selector: 'app-digital-contract-pdf',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, DecimalPipe],
  templateUrl: './digital-contract-pdf.component.html',
  styleUrls: ['./digital-contract-pdf.component.scss']
})
export class DigitalContractPdfComponent implements OnInit {
  contract: DigitalContract | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private service: DigitalContractService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.service.getById(+id).subscribe({
        next: (data) => { this.contract = data; this.loading = false; },
        error: () => { this.error = 'Impossible de charger le contrat.'; this.loading = false; }
      });
    }
  }

  printPdf(): void {
    window.print();
  }
}
