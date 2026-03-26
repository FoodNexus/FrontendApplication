import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatchFractionneService } from '../../../services/match-fractionne.service';
import { LotService } from '../../../services/lot.service';
import { MatchFractionneResponse } from '../../../models/match-fractionne.model';
import { LotResponse } from '../../../models/lot.model';

@Component({
  selector: 'app-matching-resultat',
  templateUrl: './matching-resultat.component.html'
})
export class MatchingResultatComponent implements OnInit {

  lot: LotResponse | null = null;
  matchs: MatchFractionneResponse[] = [];

  constructor(
    private matchService: MatchFractionneService,
    private lotService: LotService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const lotId = +this.route.snapshot.params['lotId'];
    this.lotService.getById(lotId).subscribe(data => this.lot = data);
    this.matchService.getByLotId(lotId).subscribe(data => this.matchs = data);
  }

  getStatutBadge(s: string): string {
    switch (s) {
      case 'EN_ATTENTE_LOGISTIQUE': return 'bg-warning text-dark';
      case 'CONFIRME': return 'bg-primary';
      case 'LIVRE': return 'bg-success';
      default: return 'bg-secondary';
    }
  }
}