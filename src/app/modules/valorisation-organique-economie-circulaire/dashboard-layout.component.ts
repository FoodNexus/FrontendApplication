import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

type AdminStatus = 'In Process' | 'Recycled' | 'Pending Collection' | 'Rejected';

interface RecyclableSnapshot {
  id: number;
  name: string;
  quantityKg: number;
  status: AdminStatus;
  imageUrl?: string;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="dashboard-shell">
      <header class="topbar">
        <div class="topbar-inner">
          <div class="brand">
            <p class="eyebrow">NORDIC Workspace</p>
            <h1>Team Dashboard</h1>
          </div>
        </div>

      </header>

      <main class="workspace-layout">
        <aside class="module-sidebar">
          <h2>Modules</h2>
          <p>Select a workspace</p>
          <nav class="sidebar-links" aria-label="Module navigation">
            <a
              *ngFor="let item of navItems"
              [routerLink]="item.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
            >
              {{ item.label }}
            </a>
          </nav>
        </aside>

        <section class="content">
          <router-outlet></router-outlet>
        </section>
      </main>

      <section class="charts-zone">
        <div class="stats-dashboard">
          <article *ngFor="let card of statsCards">
            <span>{{ card.label }}</span>
            <strong>{{ card.value }}</strong>
          </article>
        </div>

        <div class="status-breakdown">
          <span *ngFor="let status of statusCards">
            {{ status.label }}: <strong>{{ status.value }}</strong>
          </span>
        </div>

        <article class="chart-card">
          <div class="chart-head">
            <h2>Status Distribution (Pie)</h2>
            <p>Live split of recyclable lots by current status</p>
          </div>
          <div class="donut-wrap" *ngIf="totalItems > 0; else noStats">
            <svg viewBox="0 0 220 220" class="donut" aria-label="Status distribution donut chart">
              <g transform="translate(110 110)">
                <circle r="70" cx="0" cy="0" fill="none" stroke="#f3f4f6" stroke-width="26"></circle>
                <circle
                  *ngFor="let segment of donutSegments"
                  r="70"
                  cx="0"
                  cy="0"
                  fill="none"
                  [attr.stroke]="segment.color"
                  stroke-width="26"
                  [attr.stroke-dasharray]="segment.dasharray"
                  [attr.stroke-dashoffset]="segment.dashoffset"
                  stroke-linecap="butt"
                  transform="rotate(-90)"
                ></circle>
              </g>
              <text x="110" y="103" text-anchor="middle" class="donut-center-label">{{ totalItems }}</text>
              <text x="110" y="123" text-anchor="middle" class="donut-center-sub">lots</text>
            </svg>
            <div class="legend">
              <div *ngFor="let segment of donutSegments" class="legend-row">
                <span class="swatch" [style.background]="segment.color"></span>
                <span class="legend-label">{{ segment.label }}</span>
                <strong>{{ segment.value }}</strong>
              </div>
            </div>
          </div>
        </article>

        <article class="chart-card">
          <div class="chart-head">
            <h2>Inventory Trend (Curve)</h2>
            <p>Estimated weekly recyclable volume trend</p>
          </div>
          <div class="line-wrap" *ngIf="trendPoints.length > 1; else noStats">
            <svg viewBox="0 0 520 220" class="line-chart" aria-label="Inventory trend line chart">
              <line x1="44" y1="20" x2="44" y2="184" class="axis"></line>
              <line x1="44" y1="184" x2="500" y2="184" class="axis"></line>
              <polyline [attr.points]="trendPolyline" class="trend-line"></polyline>
              <circle
                *ngFor="let point of trendPoints"
                [attr.cx]="point.x"
                [attr.cy]="point.y"
                r="4"
                class="trend-dot"
              ></circle>
              <text
                *ngFor="let point of trendPoints; let i = index"
                [attr.x]="point.x"
                y="206"
                text-anchor="middle"
                class="x-label"
              >
                {{ trendLabels[i] }}
              </text>
            </svg>
          </div>
        </article>
      </section>

      <ng-template #noStats>
        <p class="empty-stats">Add recyclable items to see chart statistics.</p>
      </ng-template>
    </div>
  `,
  styles: [`
    .dashboard-shell {
      min-height: 100vh;
      background: #f5f5f0;
    }

    .topbar {
      border-bottom: 1px solid #d8d8d8;
      background: #ffffff;
      padding: 1.1rem 1.5rem 1rem;
      position: sticky;
      top: 0;
      z-index: 5;
    }

    .topbar-inner {
      width: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
      padding-bottom: 0.85rem;
    }

    .eyebrow {
      margin: 0 0 0.25rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.72rem;
    }

    .brand h1 {
      margin: 0;
      font-size: 1.4rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .stats-dashboard {
      display: flex;
      gap: 0.65rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .stats-dashboard article {
      border: 1px solid #d4d4d4;
      background: #fafafa;
      border-radius: 10px;
      padding: 0.45rem 0.7rem;
      min-width: 140px;
    }

    .stats-dashboard span {
      display: block;
      color: #6b7280;
      font-size: 0.75rem;
      margin-bottom: 0.2rem;
    }

    .stats-dashboard strong {
      color: #111827;
      font-size: 0.9rem;
    }

    .status-breakdown {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      justify-content: flex-end;
      width: 100%;
      margin-top: 0.55rem;
    }

    .status-breakdown span {
      border: 1px solid #e5e7eb;
      border-radius: 999px;
      padding: 0.24rem 0.6rem;
      background: #ffffff;
      color: #4b5563;
      font-size: 0.76rem;
    }

    .status-breakdown strong {
      color: #111827;
      font-size: 0.78rem;
    }

    .workspace-layout {
      width: 100%;
      margin: 0;
      padding: 1.5rem;
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 1rem;
    }

    .charts-zone {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 1rem;
      padding: 0 1.5rem 1.2rem;
      margin-top: 0.25rem;
    }

    .chart-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 0.9rem;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.04);
    }

    .chart-head h2 {
      margin: 0;
      font-size: 0.98rem;
      color: #111827;
    }

    .chart-head p {
      margin: 0.35rem 0 0.6rem;
      color: #6b7280;
      font-size: 0.82rem;
    }

    .donut-wrap {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 0.8rem;
      align-items: center;
    }

    .donut {
      width: 220px;
      height: 220px;
    }

    .donut-center-label {
      fill: #111827;
      font-size: 28px;
      font-weight: 700;
    }

    .donut-center-sub {
      fill: #6b7280;
      font-size: 12px;
    }

    .legend {
      display: grid;
      gap: 0.45rem;
    }

    .legend-row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 0.55rem;
      align-items: center;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 0.35rem 0.5rem;
      font-size: 0.82rem;
    }

    .swatch {
      width: 12px;
      height: 12px;
      border-radius: 999px;
      display: inline-block;
    }

    .legend-label {
      color: #4b5563;
    }

    .line-wrap {
      overflow-x: auto;
    }

    .line-chart {
      width: 100%;
      min-width: 520px;
      height: 220px;
    }

    .axis {
      stroke: #d1d5db;
      stroke-width: 1.3;
    }

    .trend-line {
      fill: none;
      stroke: #065f46;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .trend-dot {
      fill: #065f46;
      stroke: #ffffff;
      stroke-width: 1.5;
    }

    .x-label {
      fill: #6b7280;
      font-size: 11px;
    }

    .empty-stats {
      margin: 0;
      color: #6b7280;
      font-size: 0.85rem;
      padding: 0.4rem 0.2rem;
    }

    .module-sidebar {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 1rem;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.04);
      height: calc(100vh - 170px);
      min-height: 400px;
      position: sticky;
      top: 95px;
      display: flex;
      flex-direction: column;
    }

    .module-sidebar h2 {
      margin: 0;
      font-size: 1rem;
      color: #111827;
    }

    .module-sidebar p {
      margin: 0.35rem 0 0.8rem;
      color: #6b7280;
      font-size: 0.82rem;
    }

    .sidebar-links {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      overflow-y: auto;
      padding-right: 0.2rem;
    }

    .sidebar-links a {
      text-decoration: none;
      border: 1px solid #e5e7eb;
      background: #fcfcfc;
      border-radius: 8px;
      padding: 0.55rem 0.6rem;
      color: #111827;
      transition: all 0.2s ease;
      font-size: 0.86rem;
      line-height: 1.3;
    }

    .sidebar-links a:hover {
      border-color: #9ca3af;
      background: #f7f7f7;
    }

    .sidebar-links a.active {
      border-color: #111827;
      background: #111827;
      color: #ffffff;
    }

    .content {
      min-width: 0;
    }

    @media (max-width: 740px) {
      .topbar-inner {
        align-items: flex-start;
        flex-direction: column;
      }

      .workspace-layout {
        grid-template-columns: 1fr;
      }

      .charts-zone {
        grid-template-columns: 1fr;
      }

      .donut-wrap {
        grid-template-columns: 1fr;
        justify-items: center;
      }

      .module-sidebar {
        position: static;
        height: 280px;
        min-height: 280px;
      }
    }
  `]
})
export class DashboardLayoutComponent {
  private readonly storageKey = 'gestion-receveur-recyclables';
  private readonly statusColors: Record<AdminStatus, string> = {
    'In Process': '#1d4ed8',
    'Pending Collection': '#065f46',
    Recycled: '#6b7280',
    Rejected: '#dc2626'
  };

  navItems = [
    { label: 'gestionReceveur/Recyclables Admin', path: '/gestion-receveur/recyclables' }
  ];

  protected get statsCards(): Array<{ label: string; value: string | number }> {
    const items = this.getRecyclables();
    const totalKg = items.reduce((sum, item) => sum + item.quantityKg, 0);
    const avgLot = items.length > 0 ? Math.round(totalKg / items.length) : 0;
    return [
      { label: 'Tracked products', value: items.length },
      { label: 'Total inventory', value: `${totalKg} kg` },
      { label: 'Avg lot size', value: `${avgLot} kg` }
    ];
  }

  protected get statusCards(): Array<{ label: string; value: number }> {
    const items = this.getRecyclables();
    const statuses: AdminStatus[] = ['In Process', 'Pending Collection', 'Recycled', 'Rejected'];
    return statuses.map((status) => ({
      label: status,
      value: items.filter((item) => item.status === status).length
    }));
  }

  protected get totalItems(): number {
    return this.getRecyclables().length;
  }

  protected get donutSegments(): Array<{
    label: AdminStatus;
    value: number;
    color: string;
    dasharray: string;
    dashoffset: number;
  }> {
    const items = this.getRecyclables();
    const statuses: AdminStatus[] = ['In Process', 'Pending Collection', 'Recycled', 'Rejected'];
    const counts = statuses.map((status) => items.filter((item) => item.status === status).length);
    const total = counts.reduce((sum, value) => sum + value, 0);
    if (total === 0) {
      return [];
    }

    const circumference = 2 * Math.PI * 70;
    let cumulative = 0;
    return statuses.map((status, index) => {
      const value = counts[index];
      const length = (value / total) * circumference;
      const segment = {
        label: status,
        value,
        color: this.statusColors[status],
        dasharray: `${length} ${circumference - length}`,
        dashoffset: -cumulative
      };
      cumulative += length;
      return segment;
    });
  }

  protected get trendLabels(): string[] {
    return ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
  }

  protected get trendPoints(): Array<{ x: number; y: number }> {
    const values = this.buildTrendSeries();
    const minX = 70;
    const maxX = 470;
    const minY = 28;
    const maxY = 176;
    const maxValue = Math.max(...values, 1);

    return values.map((value, index) => {
      const x = minX + (index * (maxX - minX)) / Math.max(values.length - 1, 1);
      const y = maxY - (value / maxValue) * (maxY - minY);
      return { x: +x.toFixed(1), y: +y.toFixed(1) };
    });
  }

  protected get trendPolyline(): string {
    return this.trendPoints.map((point) => `${point.x},${point.y}`).join(' ');
  }

  private buildTrendSeries(): number[] {
    const totalKg = this.getRecyclables().reduce((sum, item) => sum + item.quantityKg, 0);
    const base = Math.max(totalKg, 20);
    return [0.58, 0.72, 0.68, 0.84, 0.79, 1].map((ratio) => Math.round(base * ratio));
  }

  private getRecyclables(): RecyclableSnapshot[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw) as RecyclableSnapshot[];
    } catch {
      return [];
    }
  }
}
