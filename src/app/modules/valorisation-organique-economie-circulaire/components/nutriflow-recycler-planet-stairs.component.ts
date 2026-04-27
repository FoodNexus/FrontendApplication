import { AfterViewInit, Component, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../gestion-user/services/auth.service';
import {
  NUTRIFLOW_CREDITS_MUTATED_EVENT,
  NUTRIFLOW_YEARLY_RECYCLING_GOAL,
  RecyclerCreditsService
} from '../services/recycler-credits.service';
import { NUTRIFLOW_KEY_DISPLAY_NAMES_STORAGE_KEY } from '../storage/recycler-operations.storage';

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
  template: `
    <section class="planet-stairs" aria-label="Objectif annuel et arrière-plan compétitif">
      <div class="planet-stairs__intro">
        <h3 class="planet-stairs__title">Objectif {{ yearlyGoal }} opérations — ascension collective</h3>
        <p class="planet-stairs__sub">
          La jauge <strong>{{ yearlyGoal }} opérations / an</strong> cumule vos recyclages
          <strong>validés cette année</strong> et les <strong>sauts mini-jeu</strong> (1 crédit par saut). Les marches
          suivent cette progression.
        </p>
      </div>

      <div class="planet-stairs__meter" aria-label="Progression annuelle">
        <div class="planet-stairs__meter-row">
          <span class="planet-stairs__meter-label"
            >Votre année en cours : <strong>{{ meterYearOps }} / {{ yearlyGoal }}</strong>
            (validations + sauts jeu)</span
          >
          <span class="planet-stairs__meter-pct">{{ yearProgressPct | number : '1.0-0' }}&nbsp;%</span>
        </div>
        <div class="planet-stairs__meter-track">
          <div class="planet-stairs__meter-fill" [style.width.%]="yearProgressPct"></div>
        </div>
        <p class="planet-stairs__meter-hint">
          Solde crédits fidélité : <strong>{{ creditBalance }}</strong>
          <ng-container *ngIf="playBonusSteps > 0">
            · Sauts payés (jeu, 1 crédit / saut) : <strong>{{ playBonusSteps }}</strong>
          </ng-container>
        </p>
      </div>

      <div class="planet-stairs__hud">
        <span>Classement session ({{ currentYear }}) — <strong>{{ roster.length }}</strong> concurrents</span>
      </div>

      <div class="planet-stairs__scene">
        <div class="planet-stairs__decor-trees" aria-hidden="true">
          <div class="planet-stairs__tree planet-stairs__tree--left">
            <span class="planet-stairs__tree-foliage"></span>
            <span class="planet-stairs__tree-trunk"></span>
          </div>
          <div class="planet-stairs__tree planet-stairs__tree--right">
            <span class="planet-stairs__tree-foliage planet-stairs__tree-foliage--small"></span>
            <span class="planet-stairs__tree-trunk"></span>
          </div>
          <div class="planet-stairs__bush planet-stairs__bush--left"></div>
          <div class="planet-stairs__bush planet-stairs__bush--right"></div>
        </div>

        <div class="planet-stairs__sky">
          <div class="planet-stairs__planet" [class.planet-stairs__planet--glow]="goalReached">
            <span class="planet-stairs__planet-globe" aria-hidden="true"></span>
            <span class="planet-stairs__planet-label">Planète plus propre</span>
          </div>
        </div>

        <div class="planet-stairs__stairs-wrap">
          <div class="planet-stairs__stringer" aria-hidden="true"></div>
          <div class="planet-stairs__steps">
            <div
              class="planet-stairs__flight-step"
              *ngFor="let n of stepIndices; index as i"
              [class.planet-stairs__flight-step--past]="combinedSelfStepIndex > 0 && i < combinedSelfStepIndex"
              [class.planet-stairs__flight-step--current]="combinedSelfStepIndex >= 0 && i === combinedSelfStepIndex"
            >
              <div class="planet-stairs__tread">
                <span class="planet-stairs__tread-edge"></span>
              </div>
              <div class="planet-stairs__riser"></div>
            </div>
          </div>
        </div>

        <div class="planet-stairs__players" aria-hidden="false">
          <div
            class="planet-stairs__player"
            *ngFor="let p of roster; trackBy: trackPlayer"
            [class.planet-stairs__player--self]="p.isSelf"
            [class.planet-stairs__player--jump]="jumpingPlay && p.isSelf"
            [style.left.%]="p.lanePct"
            [style.bottom.px]="p.bottomPx"
          >
            <span class="planet-stairs__nametag">{{ p.label }}</span>
            <span class="planet-stairs__character-fig" aria-hidden="true"></span>
          </div>
        </div>
      </div>

      <div class="planet-stairs__actions">
        <button
          type="button"
          class="planet-stairs__btn"
          (click)="onPlayStepClick()"
          [disabled]="creditBalance <= 0 || jumpingPlay"
        >
          Faire un pas (−1 crédit)
        </button>
        <p class="planet-stairs__hint" *ngIf="creditBalance <= 0">
          Pas de crédit disponible : faites valider des opérations pour jouer, ou avancez via vos opérations annuelles
          (barre et marches).
        </p>
      </div>

      <p class="planet-stairs__celebrate" *ngIf="goalReached">
        Objectif annuel atteint — merci pour votre engagement NutriFlow.
      </p>
    </section>
  `,
  styles: [`
    .planet-stairs { position: relative; overflow: hidden;
      background: linear-gradient(135deg, rgba(220, 252, 231, 0.5) 0%, transparent 50%),
        linear-gradient(180deg, #e0f2fe 0%, #ecfdf5 32%, #f0fdf4 55%, #f8fafc 100%);
      border: 1px solid rgba(14, 165, 233, 0.2); border-radius: 16px; padding: 1rem 1.1rem 1.15rem;
      box-shadow: 0 8px 28px rgba(6, 95, 70, 0.08); height: 100%; }
    .planet-stairs::after { content: ''; position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.65); }
    .planet-stairs__title { margin: 0 0 0.35rem; font-size: 0.98rem; font-weight: 700; color: #0c4a6e; line-height: 1.3; }
    .planet-stairs__sub { margin: 0; font-size: 0.76rem; color: #475569; line-height: 1.45; }
    .planet-stairs__meter { margin-top: 0.75rem; padding: 0.55rem 0.65rem; background: rgba(255, 255, 255, 0.92);
      border-radius: 10px; border: 1px solid #e2e8f0; }
    .planet-stairs__meter-row { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem;
      font-size: 0.78rem; color: #334155; margin-bottom: 0.35rem; }
    .planet-stairs__meter-pct { font-weight: 800; color: #047857; flex-shrink: 0; }
    .planet-stairs__meter-track { height: 10px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
    .planet-stairs__meter-fill { height: 100%; border-radius: inherit;
      background: linear-gradient(90deg, #34d399, #059669); transition: width 0.4s ease; min-width: 0; }
    .planet-stairs__meter-hint { margin: 0.4rem 0 0; font-size: 0.72rem; color: #64748b; }
    .planet-stairs__hud { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem; margin-top: 0.65rem;
      font-size: 0.74rem; color: #475569; }
    .planet-stairs__scene { position: relative; margin-top: 0.75rem; height: min(52vw, 300px); max-height: 300px;
      min-height: 220px; border-radius: 14px; overflow: hidden; border: 1px solid rgba(14, 165, 233, 0.3);
      background: radial-gradient(ellipse 120% 80% at 50% 0%, rgba(255, 255, 255, 0.55) 0%, transparent 55%),
        linear-gradient(180deg, #7dd3fc 0%, #bae6fd 22%, #e0f2fe 45%, #bbf7d0 78%, #86efac 100%);
      box-shadow: inset 0 -20px 40px rgba(22, 101, 52, 0.12); }
    .planet-stairs__decor-trees { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
    .planet-stairs__tree { position: absolute; bottom: 6%; display: flex; flex-direction: column; align-items: center;
      filter: drop-shadow(0 3px 4px rgba(21, 128, 61, 0.25)); }
    .planet-stairs__tree--left { left: 4%; }
    .planet-stairs__tree--right { right: 5%; transform: scale(0.88); }
    .planet-stairs__tree-foliage { width: 0; height: 0; border-left: 20px solid transparent;
      border-right: 20px solid transparent; border-bottom: 34px solid #15803d; position: relative; margin-bottom: -4px; }
    .planet-stairs__tree-foliage::before { content: ''; position: absolute; left: 50%; transform: translateX(-50%);
      bottom: -26px; border-left: 16px solid transparent; border-right: 16px solid transparent;
      border-bottom: 26px solid #166534; }
    .planet-stairs__tree-foliage--small { border-bottom-width: 26px; border-left-width: 16px; border-right-width: 16px; }
    .planet-stairs__tree-trunk { width: 11px; height: 20px;
      background: linear-gradient(90deg, #5c4033, #78350f 45%, #451a03); border-radius: 2px; }
    .planet-stairs__bush { position: absolute; bottom: 8%; width: 32px; height: 20px;
      background: radial-gradient(ellipse at 50% 80%, #22c55e, #15803d 70%);
      border-radius: 50% 50% 45% 45% / 60% 60% 40% 40%; opacity: 0.9; }
    .planet-stairs__bush--left { left: 14%; transform: scale(0.85); }
    .planet-stairs__bush--right { right: 16%; }
    .planet-stairs__sky { position: absolute; left: 0; right: 0; top: 0; height: 36%; display: flex;
      align-items: center; justify-content: center; padding-top: 0.25rem; z-index: 2; }
    .planet-stairs__planet { display: flex; flex-direction: column; align-items: center; gap: 0.15rem;
      transition: filter 0.4s ease, transform 0.4s ease; }
    .planet-stairs__planet--glow { filter: drop-shadow(0 0 12px rgba(52, 211, 153, 0.75)); transform: scale(1.04); }
    .planet-stairs__planet-globe { width: 48px; height: 48px; border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, #6ee7b7, #059669 45%, #047857 70%, #064e3b);
      box-shadow: inset -4px -4px 12px rgba(0, 0, 0, 0.25), 0 4px 14px rgba(5, 150, 105, 0.35); }
    .planet-stairs__planet-label { font-size: 0.62rem; font-weight: 700; color: #0f766e; text-transform: uppercase;
      letter-spacing: 0.04em; text-align: center; max-width: 6.5rem; line-height: 1.15; }
    .planet-stairs__stairs-wrap { position: absolute; left: 50%; transform: translateX(-50%); bottom: 12px;
      width: 56%; max-width: 160px; height: 58%; z-index: 2; }
    .planet-stairs__stringer { position: absolute; left: 0; top: 0; bottom: 0; width: 9px;
      background: linear-gradient(90deg, #57534e 0%, #78716c 40%, #a8a29e 100%);
      border-radius: 4px 0 0 4px;
      box-shadow: inset 2px 0 4px rgba(0, 0, 0, 0.2), 2px 0 6px rgba(0, 0, 0, 0.12); }
    .planet-stairs__steps { position: absolute; left: 9px; right: 0; bottom: 0; top: 3px;
      display: flex; flex-direction: column-reverse; justify-content: flex-start; }
    .planet-stairs__flight-step { display: flex; flex-direction: column; flex-shrink: 0; width: 100%;
      transform: skewX(-2deg); transform-origin: bottom left; }
    .planet-stairs__tread { position: relative; height: 11px; border-radius: 4px 5px 2px 3px;
      background: linear-gradient(180deg, #f1f5f9 0%, #cbd5e1 18%, #94a3b8 92%, #64748b);
      border: 1px solid #475569; border-bottom: none;
      box-shadow: 0 4px 7px rgba(15, 23, 42, 0.2), inset 0 2px 0 rgba(255, 255, 255, 0.45); }
    .planet-stairs__tread-edge { position: absolute; left: 0; right: 0; bottom: 0; height: 2px;
      background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.12)); border-radius: 0 0 2px 2px; }
    .planet-stairs__riser { height: 8px; margin-left: 4px; width: calc(100% - 4px);
      background: linear-gradient(90deg, #57534e 0%, #44403c 55%, #292524); border-radius: 0 0 0 3px;
      box-shadow: inset 3px 0 6px rgba(0, 0, 0, 0.35); border: 1px solid #1c1917; border-top: none; }
    .planet-stairs__flight-step--past .planet-stairs__tread {
      background: linear-gradient(180deg, #bbf7d0 0%, #86efac 35%, #4ade80 90%, #16a34a);
      border-color: #15803d; }
    .planet-stairs__flight-step--past .planet-stairs__riser {
      background: linear-gradient(90deg, #166534 0%, #14532d 100%); border-color: #052e16; }
    .planet-stairs__flight-step--current .planet-stairs__tread {
      background: linear-gradient(180deg, #fde68a 0%, #fbbf24 40%, #f59e0b 95%, #d97706);
      border-color: #b45309; }
    .planet-stairs__flight-step--current .planet-stairs__riser {
      background: linear-gradient(90deg, #b45309 0%, #92400e 100%); }
    .planet-stairs__players { position: absolute; left: 0; right: 0; bottom: 0; top: 0; z-index: 4; pointer-events: none; }
    .planet-stairs__player { position: absolute; display: flex; flex-direction: column; align-items: center;
      width: 44px; margin-left: -22px; transition: bottom 0.45s cubic-bezier(0.34, 1.15, 0.64, 1); }
    .planet-stairs__player--jump { animation: planet-stairs-hop 0.5s ease; }
    @keyframes planet-stairs-hop {
      0% { transform: translateY(0); }
      40% { transform: translateY(-14px); }
      100% { transform: translateY(0); }
    }
    .planet-stairs__nametag { display: block; max-width: 4.2rem; padding: 0.1rem 0.28rem; margin-bottom: 2px;
      font-size: 0.58rem; font-weight: 700; line-height: 1.15; color: #fff; text-align: center;
      background: rgba(15, 23, 42, 0.78); border-radius: 4px; overflow: hidden; text-overflow: ellipsis;
      white-space: nowrap; border: 1px solid rgba(255, 255, 255, 0.2); }
    .planet-stairs__player--self .planet-stairs__nametag {
      background: linear-gradient(135deg, #047857, #059669); border-color: #a7f3d0; color: #ecfdf5; }
    .planet-stairs__character-fig { display: block; width: 30px; height: 38px;
      background: linear-gradient(180deg, #334155 0%, #475569 50%, #64748b 100%);
      border-radius: 8px 8px 5px 5px; position: relative; box-shadow: 0 3px 10px rgba(15, 23, 42, 0.35); }
    .planet-stairs__character-fig::before { content: ''; position: absolute; top: 6px; left: 50%;
      transform: translateX(-50%); width: 17px; height: 12px; background: #fde68a; border-radius: 50%;
      box-shadow: 0 0 0 2px #1e293b; }
    .planet-stairs__player--self .planet-stairs__character-fig {
      background: linear-gradient(180deg, #14532d 0%, #166534 45%, #22c55e 100%);
      box-shadow: 0 0 0 2px #fbbf24, 0 4px 12px rgba(22, 101, 52, 0.45); width: 32px; height: 40px; }
    .planet-stairs__player--self .planet-stairs__character-fig::before { box-shadow: 0 0 0 2px #14532d; }
    .planet-stairs__actions { margin-top: 0.85rem; }
    .planet-stairs__btn {
      width: 100%; padding: 0.55rem 0.9rem; border: none; border-radius: 12px; font-weight: 700; font-size: 0.82rem;
      cursor: pointer; color: #fff; background: linear-gradient(135deg, #059669, #0d9488);
      box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35); transition: filter 0.2s ease, transform 0.15s ease;
    }
    .planet-stairs__btn:hover:not(:disabled) { filter: brightness(1.05); transform: translateY(-1px); }
    .planet-stairs__btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
    .planet-stairs__hint { margin: 0.5rem 0 0; font-size: 0.72rem; color: #64748b; line-height: 1.4; }
    .planet-stairs__celebrate { margin: 0.65rem 0 0; font-size: 0.8rem; font-weight: 600; color: #047857;
      text-align: center; }
  `]
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
    if (k.includes('nutriflow-recycler-credits') || k === NUTRIFLOW_KEY_DISPLAY_NAMES_STORAGE_KEY) {
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
        const raw = localStorage.getItem(NUTRIFLOW_KEY_DISPLAY_NAMES_STORAGE_KEY);
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
