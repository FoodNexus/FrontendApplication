import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatchFractionneService } from '../../../services/match-fractionne.service';
import { MatchFractionneResponse } from '../../../models/match-fractionne.model';

@Component({
  selector: 'app-match-detail',
  templateUrl: './match-detail.component.html',
  styleUrls: ['./match-detail.component.scss']
})
export class MatchDetailComponent implements OnInit {

  match: MatchFractionneResponse | null = null;

  constructor(private matchService: MatchFractionneService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this.matchService.getById(id).subscribe(data => this.match = data);
  }

  getStatutClass(s: string): string {
    switch (s) {
      case 'EN_ATTENTE_LOGISTIQUE': return 'statut-en-cours';
      case 'CONFIRME': return 'statut-disponible';
      case 'LIVRE': return 'statut-termine';
      case 'REFUSE': return 'statut-refuse';
      case 'ANNULE': return 'statut-annule';
      default: return 'statut-default';
    }
  }
}