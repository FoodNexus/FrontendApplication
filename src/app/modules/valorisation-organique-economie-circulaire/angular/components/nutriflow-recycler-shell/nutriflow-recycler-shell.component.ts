import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../gestion-user/services/auth.service';
import { RecyclerCreditsService } from '../../services/recycler-credits.service';
import { NutriflowRecyclerRequestsService } from '../../services/nutriflow-recycler-requests.service';

@Component({
  selector: 'app-nutriflow-recycler-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  templateUrl: './nutriflow-recycler-shell.component.html'
})
export class NutriFlowRecyclerShellComponent implements OnInit {
  constructor(
    protected authService: AuthService,
    protected creditsService: RecyclerCreditsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.creditsService.maybeApplyDevNutriflowCreditSeed();
    this.rememberNutriflowDisplayNamesForRoster();
    const roles = this.authService.getUserRoles();
    const canRecycler = roles.some((r) => ['RECYCLER', 'ADMIN'].includes(r));
    const isDonor = roles.includes('DONOR');
    if (isDonor && !canRecycler) {
      void this.router.navigateByUrl('/valorisation/nutriflow-donor');
    }
  }

  get username(): string {
    return this.authService.getUsername();
  }

  /** Crédits fidélité : recycleurs uniquement (pas le back-office admin). */
  get isRecyclerCreditsUser(): boolean {
    return this.authService.hasRole('RECYCLER') && !this.authService.hasRole('ADMIN');
  }

  logout(): void {
    this.authService.logout();
  }

  /** Associe preferred_username aux clés id:/sub: pour le mini-jeu (plusieurs comptes, même Edge). */
  private rememberNutriflowDisplayNamesForRoster(): void {
    const label = this.authService.getKeycloakPreferredUsername();
    if (!label || typeof localStorage === 'undefined') {
      return;
    }
    let map: Record<string, string> = {};
    try {
      const raw = localStorage.getItem(NutriflowRecyclerRequestsService.KEY_DISPLAY_NAMES_STORAGE_KEY);
      if (raw) {
        map = JSON.parse(raw) as Record<string, string>;
        if (map == null || typeof map !== 'object') {
          map = {};
        }
      }
    } catch {
      map = {};
    }
    const keys = new Set<string>(this.authService.getNutriflowUserKeyAliases());
    keys.add(this.authService.getCreditsUserKey());
    for (const k of keys) {
      if (k && k !== 'local:anonymous') {
        map[k] = label;
      }
    }
    try {
      localStorage.setItem(NutriflowRecyclerRequestsService.KEY_DISPLAY_NAMES_STORAGE_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }
}
