import { AfterViewInit, Component, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../../../gestion-user/services/auth.service';
import {
  NUTRIFLOW_CREDITS_MUTATED_EVENT,
  NUTRIFLOW_YEARLY_RECYCLING_GOAL,
  RecyclerCreditsService
} from '../../services/recycler-credits.service';
import { NutriflowRecyclerRequestsService } from '../../services/nutriflow-recycler-requests.service';

const VISUAL_STAIRS = 20;
const STEP_UNIT_PX = 21;
const CLIMB_PX = (VISUAL_STAIRS - 1) * STEP_UNIT_PX;

interface RosterPlayer {
  userKey: string;
  label: string;
  ops: number;
  isSelf: boolean;
  lanePct: number;
  bottomPx: number;
}

@Component({
  selector: 'app-nutriflow-recycler-planet-stairs',
  standalone: true,
  imports: [NgFor, NgIf, DecimalPipe],
  templateUrl: './nutriflow-recycler-planet-stairs.component.html',
  styleUrls: ['./nutriflow-recycler-planet-stairs.component.scss']
})
export class NutriflowRecyclerPlanetStairsComponent implements OnInit, AfterViewInit, OnDestroy {
  protected readonly yearlyGoal = NUTRIFLOW_YEARLY_RECYCLING_GOAL;
  protected readonly currentYear = new Date().getFullYear();
  protected stepIndices: number[] = Array.from({ length: VISUAL_STAIRS }, (_, i) => i);
  protected roster: RosterPlayer[] = [];
  protected playBonusSteps = 0;
  protected jumpingPlay = false;

  private readonly onCreditsChanged = (): void => {
    this.ngZone.run(() => this.refresh());
  };

  constructor(
    private credits: RecyclerCreditsService,
    private auth: AuthService,
    private ngZone: NgZone
  ) {}

  protected get creditBalance(): number {
    return this.credits.getBalance();
  }

  protected get selfYearOps(): number {
    return this.credits.getYearlyVerifiedOperationCount();
  }

  /** Jauge : validations annuelles + sauts payés au mini-jeu (chacun +1 vers l’objectif). */
  protected get meterYearOps(): number {
    return (
      this.credits.getYearlyVerifiedOperationCount() +
      this.credits.getPlanetGameJumpSpendTotalForCurrentUser()
    );
  }

  protected get yearProgressPct(): number {
    return Math.min(100, (this.meterYearOps / this.yearlyGoal) * 100);
  }

  protected get goalReached(): boolean {
    return this.meterYearOps >= this.yearlyGoal;
  }

  /** Marches vert/or : progression annuelle + sauts « jeu » (crédits). */
  protected get combinedSelfStepIndex(): number {
    const base = this.baseStairStepFromYear;
    if (base < 0 && this.playBonusSteps <= 0) {
      return -1;
    }
    const b = base < 0 ? 0 : base;
    return Math.min(VISUAL_STAIRS - 1, b + this.playBonusSteps);
  }

  private get baseStairStepFromYear(): number {
    if (this.selfYearOps <= 0) {
      return -1;
    }
    const ratio = Math.min(1, this.selfYearOps / this.yearlyGoal);
    return Math.min(VISUAL_STAIRS - 1, Math.round(ratio * (VISUAL_STAIRS - 1)));
  }

  protected onPlayStepClick(): void {
    if (this.creditBalance <= 0 || this.jumpingPlay) {
      return;
    }
    if (!this.credits.spendForPlanetGame(1)) {
      return;
    }
    this.jumpingPlay = true;
    this.refresh();
    setTimeout(() => {
      this.jumpingPlay = false;
    }, 500);
  }

  ngOnInit(): void {
    this.refresh();
    if (this.auth.isLoggedIn() && !this.auth.getCurrentUser()) {
      this.auth.fetchUserProfile().subscribe({
        next: () => this.ngZone.run(() => this.refresh()),
        error: () => this.ngZone.run(() => this.refresh())
      });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener(NUTRIFLOW_CREDITS_MUTATED_EVENT, this.onCreditsChanged);
    }
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.ngZone.run(() => this.refresh()));
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener(NUTRIFLOW_CREDITS_MUTATED_EVENT, this.onCreditsChanged);
    }
  }

  @HostListener('window:storage', ['$event'])
  onStorage(ev: StorageEvent): void {
    const k = ev.key ?? '';
    if (
      k.includes('nutriflow-recycler-credits') ||
      k === NutriflowRecyclerRequestsService.KEY_DISPLAY_NAMES_STORAGE_KEY
    ) {
      this.ngZone.run(() => this.refresh());
    }
  }

  protected trackPlayer(_index: number, p: RosterPlayer): string {
    return p.userKey;
  }

  private refresh(): void {
    this.playBonusSteps = this.credits.getPlanetGameJumpSpendTotalForCurrentUser();
    this.roster = this.buildRoster();
  }

  private playerBottomPx(ops: number, bonusSteps: number): number {
    const ratio = ops <= 0 ? 0 : Math.min(1, ops / this.yearlyGoal);
    let bottomPx = 14 + ratio * CLIMB_PX;
    bottomPx += bonusSteps * STEP_UNIT_PX;
    return Math.min(bottomPx, 14 + CLIMB_PX + 10 * STEP_UNIT_PX);
  }

  private buildRoster(): RosterPlayer[] {
    const aliases = this.auth.getNutriflowUserKeyAliases();
    const aliasSet = new Set(aliases);
    const selfOps = this.credits.getYearlyVerifiedOperationCount();

    const others = new Map<string, number>();
    for (const row of this.credits.getYearlyLeaderboard(40)) {
      if (aliasSet.has(row.userKey)) {
        continue;
      }
      others.set(row.userKey, row.ops);
    }

    type TEntry = { userKey: string; ops: number; label: string; isSelf: boolean };
    const entries: TEntry[] = [
      {
        userKey: '__self__',
        ops: selfOps,
        label: this.selfDisplayName(),
        isSelf: true
      }
    ];

    for (const [userKey, ops] of others.entries()) {
      entries.push({
        userKey,
        ops,
        label: this.labelForOtherKey(userKey),
        isSelf: false
      });
    }

    const sorted = entries
      .sort((a, b) => b.ops - a.ops || (a.isSelf ? -1 : 0) - (b.isSelf ? -1 : 0))
      .slice(0, 8);

    const n = sorted.length;

    return sorted.map((e, idx) => {
      const lanePct = n <= 1 ? 50 : 10 + (idx / (n - 1)) * 80;
      const bonusSteps = e.isSelf
        ? this.credits.getPlanetGameJumpSpendTotalForCurrentUser()
        : this.credits.getPlanetGameJumpSpendTotalForUserKey(e.userKey);
      const bottomPx = this.playerBottomPx(e.ops, bonusSteps);
      return {
        userKey: e.userKey,
        label: this.truncateLabel(e.label),
        ops: e.ops,
        isSelf: e.isSelf,
        lanePct,
        bottomPx
      };
    });
  }

  private selfDisplayName(): string {
    const u = this.auth.getCurrentUser();
    if (u?.prenom || u?.nom) {
      return `${u.prenom ?? ''} ${u.nom ?? ''}`.trim();
    }
    return this.auth.getUsername();
  }

  private labelForOtherKey(userKey: string): string {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(NutriflowRecyclerRequestsService.KEY_DISPLAY_NAMES_STORAGE_KEY);
        if (raw) {
          const map = JSON.parse(raw) as Record<string, string>;
          const d = map[userKey];
          if (typeof d === 'string' && d.trim().length > 0) {
            return d.trim();
          }
        }
      } catch {
        /* ignore */
      }
    }
    const tail = userKey.replace(/^[^:]+:/, '').slice(-4) || '?';
    return `R·${tail}`;
  }

  private truncateLabel(s: string): string {
    const t = s.trim();
    if (t.length <= 14) {
      return t;
    }
    return `${t.slice(0, 12)}…`;
  }
}
