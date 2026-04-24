import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-valorisation-dashboard-layout',
  standalone: true,
  imports: [NgFor, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="dashboard-shell">
      <header class="topbar">
        <div class="topbar-inner">
          <div class="brand">
            <p class="eyebrow">FoodNexus · Valorisation</p>
            <h1>Économie circulaire</h1>
            <p class="subtitle">Espace recyclage et flux organiques</p>
          </div>

          <div class="metrics">
            <article>
              <span>Outils</span>
              <strong>4</strong>
            </article>
          </div>
        </div>
      </header>

      <main class="workspace-layout">
        <aside class="module-sidebar">
          <h2>Navigation</h2>
          <p>Choisissez un écran</p>
          <nav class="sidebar-links" aria-label="Navigation valorisation">
            <a
              *ngFor="let item of navItems"
              [routerLink]="[valorisationBase, item.path]"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
            >
              {{ item.label }}
            </a>
          </nav>
        </aside>

        <section class="content">
          <router-outlet></router-outlet>
        </section>
      </main>
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

    .brand .subtitle {
      margin: 0.35rem 0 0 0;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .metrics {
      display: flex;
      gap: 0.65rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .metrics article {
      border: 1px solid #d4d4d4;
      background: #fafafa;
      border-radius: 10px;
      padding: 0.45rem 0.7rem;
      min-width: 140px;
    }

    .metrics span {
      display: block;
      color: #6b7280;
      font-size: 0.75rem;
      margin-bottom: 0.2rem;
    }

    .metrics strong {
      color: #111827;
      font-size: 0.9rem;
    }

    .workspace-layout {
      width: 100%;
      margin: 0;
      padding: 1.5rem;
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 1rem;
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

      .module-sidebar {
        position: static;
        height: auto;
        min-height: 0;
      }
    }
  `]
})
export class ValorisationDashboardLayoutComponent {
  /** Must match app.routes lazy path for this feature area */
  protected readonly valorisationBase = '/valorisation';

  protected readonly navItems: { label: string; path: string; exact?: boolean }[] = [
    { label: "Vue d'ensemble", path: 'workspace', exact: true },
    { label: 'CRUD recyclables', path: 'recyclables' },
    { label: 'Front recycler', path: 'recycler-front' },
    { label: 'Validation demandes (store)', path: 'store-requests' }
  ];
}
