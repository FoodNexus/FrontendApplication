import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LotService } from '../../../services/lot.service';
import { LotRequest } from '../../../models/lot.model';
import { NiveauUrgence } from '../../../models/enums.model';

@Component({
  selector: 'app-lot-form',
  templateUrl: './lot-form.component.html'
})
export class LotFormComponent implements OnInit {

  lot: LotRequest = { donneurId: 0, niveauUrgence: NiveauUrgence.FAIBLE };
  urgences = Object.values(NiveauUrgence);
  isEditMode = false;
  lotId: number | null = null;
  errorMessage = '';

  constructor(private lotService: LotService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.lotId = +id;
      this.lotService.getById(this.lotId).subscribe({
        next: (data) => { this.lot = { donneurId: data.donneurId, niveauUrgence: data.niveauUrgence }; },
        error: () => this.errorMessage = 'Lot non trouvé'
      });
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    if (this.isEditMode && this.lotId) {
      this.lotService.update(this.lotId, this.lot).subscribe({
        next: () => this.router.navigate(['donneur/lots']),
        error: (err) => this.errorMessage = err.error?.message || 'Erreur'
      });
    } else {
      this.lotService.create(this.lot).subscribe({
        next: () => this.router.navigate(['donneur/lots']),
        error: (err) => this.errorMessage = err.error?.message || 'Erreur'
      });
    }
  }
}