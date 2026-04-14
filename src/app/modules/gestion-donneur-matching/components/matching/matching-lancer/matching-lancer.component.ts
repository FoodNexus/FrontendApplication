import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LotService } from '../../../services/lot.service';
import { MatchingService } from '../../../services/matching.service';
import { LotResponse } from '../../../models/lot.model';
import { MatchingResultDTO } from '../../../models/matching-result.model';

@Component({
  selector: 'app-matching-lancer',
  templateUrl: './matching-lancer.component.html',
  styleUrls: ['./matching-lancer.component.scss']
})
export class MatchingLancerComponent implements OnInit {

  lotsDisponibles: LotResponse[] = [];
  selectedLotId = 0;
  simulationResult: MatchingResultDTO | null = null;
  loading = false;
  errorMessage = '';

  constructor(
    private lotService: LotService,
    private matchingService: MatchingService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.lotService.getDisponiblesPourMatching().subscribe(data => this.lotsDisponibles = data);
    const lotId = this.route.snapshot.queryParams['lotId'];
    if (lotId) { this.selectedLotId = +lotId; }
  }

  simuler(): void {
    if (!this.selectedLotId) return;
    this.loading = true;
    this.errorMessage = '';
    this.simulationResult = null;
    this.matchingService.simulerMatching(this.selectedLotId).subscribe({
      next: (data) => { this.simulationResult = data; this.loading = false; },
      error: (err) => { this.errorMessage = err.error?.message || 'Erreur'; this.loading = false; }
    });
  }

  lancer(): void {
    if (!this.selectedLotId) return;
    if (!confirm('Lancer le matching ? Les matchs seront créés en base.')) return;
    this.loading = true;
    this.errorMessage = '';
    this.matchingService.lancerMatching(this.selectedLotId).subscribe({
      next: () => { this.loading = false; this.router.navigate(['donneur/matching/resultat', this.selectedLotId]); },
      error: (err) => { this.errorMessage = err.error?.message || 'Erreur'; this.loading = false; }
    });
  }
}