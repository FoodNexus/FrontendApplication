import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatchFractionneService } from '../../../services/match-fractionne.service';
import { LotService } from '../../../services/lot.service';
import { MatchFractionneResponse } from '../../../models/match-fractionne.model';
import { LotResponse } from '../../../models/lot.model';

@Component({
  selector: 'app-matching-resultat',
  templateUrl: './matching-resultat.component.html',
  styleUrls: ['./matching-resultat.component.scss']
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

  getStatutClass(s: string): string {
    switch (s) {
      case 'EN_ATTENTE_LOGISTIQUE': return 'statut-en-cours';
      case 'CONFIRME': return 'statut-disponible';
      case 'LIVRE': return 'statut-termine';
      case 'REFUSE': return 'statut-refuse';
      default: return 'statut-default';
    }
  }
}