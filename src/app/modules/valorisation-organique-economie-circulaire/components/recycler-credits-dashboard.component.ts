import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../gestion-user/services/auth.service';
import {
  RecyclerCreditsService,
  NUTRIFLOW_CREDITS_MUTATED_EVENT,
  CreditLedgerEntry
} from '../services/recycler-credits.service';
import {
  loadRecyclerRequests,
  RECYCLER_REQUESTS_CHANGED_EVENT,
  RecyclerRequest
} from '../storage/recycler-operations.storage';

/** Réduction sur l’abonnement partenaire NutriFlow : % par crédit, plafond. */
const PLAN_DISCOUNT_PCT_PER_CREDIT = 4;
const PLAN_DISCOUNT_PCT_CAP = 35;

@Component({
  selector: 'app-recycler-credits-dashboard',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, DatePipe],
  template: `
    <section class="loyalty-dashboard" aria-label="Tableau de bord crédits recycleur">
      <div class="dash-hero">
        <div class="dash-hero-text">
          <p class="dash-eyebrow">Programme fidélité NutriFlow</p>
          <h2 class="dash-title">Vos crédits &amp; avantages</h2>
          <p class="dash-lead">
            Chaque opération de recyclage <strong>validée par l’admin</strong> vous fait gagner des crédits.
            Ils réduisent votre <strong>plan partenaire</strong> et ouvrent des avantages exclusifs.
          </p>
        </div>
        <div class="dash-balance-card">
          <span class="dash-balance-label">Solde actuel</span>
          <strong class="dash-balance-value">{{ creditBalance }}</strong>
          <span class="dash-balance-unit">crédits</span>
          <span class="dash-tier" [class]="'tier-' + tierClass">{{ tier.label }}</span>
        </div>
      </div>

      <div class="dash-metrics">
        <article class="metric">
          <span class="metric-label">Opérations validées</span>
          <strong class="metric-value">{{ verifiedCount }}</strong>
          <span class="metric-hint">admin a approuvé la vérification</span>
        </article>
        <article class="metric">
          <span class="metric-label">Volume recyclé (validé)</span>
          <strong class="metric-value">{{ verifiedKg | number: '1.0-0' }} kg</strong>
          <span class="metric-hint">sur demandes vérifiées</span>
        </article>
        <article class="metric">
          <span class="metric-label">Demandes en cours</span>
          <strong class="metric-value">{{ openCount }}</strong>
          <span class="metric-hint">en attente ou traitement</span>
        </article>
        <article class="metric metric-highlight">
          <span class="metric-label">Réduction plan estimée</span>
          <strong class="metric-value accent">{{ planDiscountPercent }}&nbsp;%</strong>
          <span class="metric-hint">max {{ discountCap }}&nbsp;% — {{ discountPctPerCredit }}&nbsp;% par crédit</span>
        </article>
      </div>

      <div class="dash-columns">
        <article class="panel plan-panel">
          <h3 class="panel-title">
            <span class="panel-icon" aria-hidden="true">◆</span>
            Réduction sur votre plan
          </h3>
          <p class="panel-desc">
            Vos crédits s’appliquent comme une <strong>remise sur l’abonnement NutriFlow Partner</strong>
            (facturation ou renouvellement). La réduction cumulée est plafonnée pour rester équitable.
          </p>
          <div class="plan-bar-wrap" role="img" [attr.aria-label]="planBarAria">
            <div class="plan-bar-track">
              <div class="plan-bar-fill" [style.width.%]="planDiscountPercent"></div>
            </div>
            <div class="plan-bar-labels">
              <span>0&nbsp;%</span>
              <span>{{ discountCap }}&nbsp;% max</span>
            </div>
          </div>
          <p class="panel-foot">
            Exemple : avec <strong>{{ creditBalance }}</strong> crédit(s), économie jusqu’à
            <strong>{{ planDiscountPercent }}&nbsp;%</strong> sur la prochaine facture de plan (sous réserve des conditions
            commerciales).
          </p>
        </article>

        <article class="panel benefits-panel">
          <h3 class="panel-title">
            <span class="panel-icon soft" aria-hidden="true">✓</span>
            Ce que vous pouvez faire
          </h3>
          <ul class="benefits-list">
            <li>
              <strong>Remise plan</strong> — jusqu’à {{ discountCap }}&nbsp;% selon votre solde ({{ discountPctPerCredit }}&nbsp;% par
              crédit).
            </li>
            <li>
              <strong>Priorité support</strong> — palier «&nbsp;{{ tier.label }}&nbsp;» pour le traitement des demandes
              logistiques.
            </li>
            <li>
              <strong>Historique traçable</strong> — chaque crédit est lié à une demande validée (voir le journal
              ci-dessous sur la page).
            </li>
            <li>
              <strong>Impact mesurable</strong> — {{ verifiedKg | number: '1.0-0' }} kg suivis comme recyclage validé.
            </li>
          </ul>
        </article>
      </div>

      <article class="panel ledger-panel" *ngIf="recentLedger.length > 0">
        <h3 class="panel-title">Derniers crédits reçus</h3>
        <ul class="ledger-mini">
          <li *ngFor="let e of recentLedger">
            <span class="ledger-date">{{ e.createdAt | date: 'short' }}</span>
            <span class="ledger-req">{{ e.note || 'Crédit recyclage validé' }}</span>
            <span class="ledger-amt">{{ e.amount > 0 ? '+' : '' }}{{ e.amount }}</span>
          </li>
        </ul>
      </article>
    </section>
  `,
  styles: [`
    .loyalty-dashboard {
      display: grid;
      gap: 1.1rem;
      margin-bottom: 0.25rem;
    }
    .dash-hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 1rem;
      align-items: stretch;
      background: linear-gradient(125deg, #022c22 0%, #065f46 45%, #047857 100%);
      color: #ecfdf5;
      border-radius: 18px;
      padding: 1.25rem 1.35rem;
      box-shadow: 0 12px 40px rgba(6, 95, 70, 0.35);
    }
    .dash-eyebrow {
      margin: 0 0 0.35rem;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #a7f3d0;
    }
    .dash-title {
      margin: 0 0 0.5rem;
      font-size: 1.35rem;
      font-weight: 700;
      line-height: 1.2;
    }
    .dash-lead {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.5;
      color: #d1fae5;
      max-width: 40rem;
    }
    .dash-balance-card {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 14px;
      padding: 1rem 1.15rem;
      min-width: 9.5rem;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: 0.15rem;
    }
    .dash-balance-label {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #a7f3d0;
    }
    .dash-balance-value {
      font-size: 2.35rem;
      font-weight: 800;
      line-height: 1;
      color: #fff;
    }
    .dash-balance-unit {
      font-size: 0.85rem;
      color: #bbf7d0;
    }
    .dash-tier {
      margin-top: 0.35rem;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.18);
    }
    .tier-explorer { opacity: 0.95; }
    .tier-partner { background: rgba(52, 211, 153, 0.35) !important; }
    .tier-ambassador { background: rgba(251, 191, 36, 0.35) !important; color: #fef3c7 !important; }
    .tier-champion { background: rgba(196, 181, 253, 0.4) !important; color: #ede9fe !important; }

    .dash-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.75rem;
    }
    .metric {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 0.85rem 0.95rem;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
    }
    .metric-highlight {
      border-color: #a7f3d0;
      background: linear-gradient(180deg, #f0fdf4 0%, #fff 100%);
    }
    .metric-label {
      display: block;
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      margin-bottom: 0.35rem;
    }
    .metric-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
    }
    .metric-value.accent {
      color: #047857;
    }
    .metric-hint {
      display: block;
      font-size: 0.72rem;
      color: #9ca3af;
      margin-top: 0.25rem;
      line-height: 1.3;
    }

    .dash-columns {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 0.85rem;
    }
    .panel {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 1rem 1.1rem;
      box-shadow: 0 6px 22px rgba(0, 0, 0, 0.04);
    }
    .panel-title {
      margin: 0 0 0.6rem;
      font-size: 0.98rem;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .panel-icon {
      color: #059669;
      font-size: 0.85rem;
    }
    .panel-icon.soft { color: #10b981; }
    .panel-desc {
      margin: 0 0 0.85rem;
      font-size: 0.86rem;
      color: #4b5563;
      line-height: 1.5;
    }
    .panel-foot {
      margin: 0.75rem 0 0;
      font-size: 0.8rem;
      color: #6b7280;
      line-height: 1.45;
    }
    .plan-bar-wrap {
      margin-top: 0.25rem;
    }
    .plan-bar-track {
      height: 10px;
      border-radius: 999px;
      background: #e5e7eb;
      overflow: hidden;
    }
    .plan-bar-fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, #059669, #34d399);
      transition: width 0.35s ease;
    }
    .plan-bar-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      color: #9ca3af;
      margin-top: 0.35rem;
    }
    .benefits-list {
      margin: 0;
      padding-left: 1.1rem;
      font-size: 0.86rem;
      color: #374151;
      line-height: 1.55;
    }
    .benefits-list li {
      margin-bottom: 0.45rem;
    }
    .benefits-list li:last-child {
      margin-bottom: 0;
    }
    .ledger-panel {
      margin-top: 0;
    }
    .ledger-mini {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.35rem;
    }
    .ledger-mini li {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem 1rem;
      font-size: 0.84rem;
      padding: 0.4rem 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .ledger-mini li:last-child {
      border-bottom: none;
    }
    .ledger-date {
      color: #6b7280;
      min-width: 7rem;
    }
    .ledger-req {
      flex: 1;
      color: #374151;
    }
    .ledger-amt {
      font-weight: 700;
      color: #047857;
    }

    @media (max-width: 720px) {
      .dash-hero {
        grid-template-columns: 1fr;
      }
      .dash-balance-card {
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem 1rem;
      }
      .dash-balance-value {
        font-size: 1.85rem;
      }
    }
  `]
})
export class RecyclerCreditsDashboardComponent implements OnInit, OnDestroy {
  protected creditBalance = 0;
  protected verifiedCount = 0;
  protected verifiedKg = 0;
  protected openCount = 0;
  protected recentLedger: CreditLedgerEntry[] = [];
  protected tier: { label: string; key: string } = { label: 'Explorateur', key: 'explorer' };

  protected readonly discountPctPerCredit = PLAN_DISCOUNT_PCT_PER_CREDIT;
  protected readonly discountCap = PLAN_DISCOUNT_PCT_CAP;

  private readonly onRefresh = (): void => {
    this.ngZone.run(() => this.refresh());
  };

  constructor(
    private auth: AuthService,
    protected credits: RecyclerCreditsService,
    private ngZone: NgZone
  ) {}

  get planDiscountPercent(): number {
    return Math.min(PLAN_DISCOUNT_PCT_CAP, this.creditBalance * PLAN_DISCOUNT_PCT_PER_CREDIT);
  }

  get tierClass(): string {
    return this.tier.key;
  }

  get planBarAria(): string {
    return `Réduction plan estimée : ${this.planDiscountPercent} pour cent, maximum ${PLAN_DISCOUNT_PCT_CAP} pour cent`;
  }

  ngOnInit(): void {
    this.refresh();
    if (typeof window !== 'undefined') {
      window.addEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, this.onRefresh);
      window.addEventListener(NUTRIFLOW_CREDITS_MUTATED_EVENT, this.onRefresh);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener(RECYCLER_REQUESTS_CHANGED_EVENT, this.onRefresh);
      window.removeEventListener(NUTRIFLOW_CREDITS_MUTATED_EVENT, this.onRefresh);
    }
  }

  private refresh(): void {
    const scoped = this.myScopedRequests();
    this.creditBalance = this.credits.getBalance();
    this.verifiedCount = scoped.filter((r) => r.status === 'verified').length;
    this.verifiedKg = scoped
      .filter((r) => r.status === 'verified')
      .reduce((s, r) => s + (Number(r.quantityKg) || 0), 0);
    const openStatuses = [
      'awaiting_donor',
      'pending',
      'approved',
      'available',
      'pending_verification'
    ];
    this.openCount = scoped.filter((r) => openStatuses.includes(r.status)).length;
    this.tier = this.computeTier(this.creditBalance);
    this.recentLedger = this.credits.getLedgerForUser().slice(0, 6);
  }

  private myScopedRequests(): RecyclerRequest[] {
    const aliases = new Set(this.auth.getNutriflowUserKeyAliases());
    const primary = this.credits.getCurrentRecyclerKey();
    return loadRecyclerRequests().filter(
      (r) => !r.recyclerUserKey || aliases.has(r.recyclerUserKey) || r.recyclerUserKey === primary
    );
  }

  private computeTier(balance: number): { label: string; key: string } {
    if (balance >= 12) {
      return { label: 'Champion vert', key: 'champion' };
    }
    if (balance >= 6) {
      return { label: 'Ambassadeur', key: 'ambassador' };
    }
    if (balance >= 1) {
      return { label: 'Partenaire actif', key: 'partner' };
    }
    return { label: 'Explorateur', key: 'explorer' };
  }
}
